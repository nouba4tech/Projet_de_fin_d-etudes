"""Generates donnees-demo.sql: realistic demo data for the dashboard of the online version (database bd_mirador).

Every date is written relative to CURRENT_DATE(), so the same SQL file can be run again on the morning of a demo:
it first deletes the rows it created last time (tagged DEMO-MIRADOR / DMO- / DEMO-), then recreates them around
the new date. Real data is never touched, except the cleaning/maintenance state of the demo rooms, which is reset.

The database is far away (TiDB Cloud, Tokyo): rows are sent as a few multi-row INSERTs inside one transaction,
so loading takes seconds and either fully succeeds or changes nothing.

Usage:  python generer-donnees-demo.py <rooms.tsv> <clients.txt> > donnees-demo.sql
  rooms.tsv   : "<room code>\t<nightly rate>" for each room that holds no real reservation
  clients.txt : one client code per line
"""
import random
import sys

sys.stdout.reconfigure(encoding="utf-8", newline="\n")   # accents (Prêt, Entrée...) must reach MySQL as UTF-8

TAG = "DEMO-MIRADOR"
FIRST_CODE = 1_000_001                    # demo reservation codes, far above the real ones
rng = random.Random(2026)
rooms = [line.split("\t") for line in open(sys.argv[1], encoding="utf-8") if line.strip()]
rooms = [(code.strip(), int(float(price))) for code, price in rooms]
clients = [line.strip() for line in open(sys.argv[2], encoding="utf-8") if line.strip()]

maintenance = rooms[-3:]                 # 3 rooms under maintenance
cleaning = rooms[-7:-3]                  # 4 rooms being cleaned
bookable = rooms[:-7]


def day(offset, time):
    return "TIMESTAMP(DATE_ADD(CURRENT_DATE(), INTERVAL %d DAY), '%s')" % (offset, time)


def insert(table, columns, rows, suffix="", chunk=150):
    for i in range(0, len(rows), chunk):
        print("INSERT INTO %s (%s) VALUES\n  %s%s;" % (table, columns, ",\n  ".join(rows[i:i + chunk]), suffix))


print("-- Donnees de demonstration du tableau de bord (generees par generer-donnees-demo.py). Relancable.")
print("START TRANSACTION;")
# the tag is written as a literal: a user variable (@tag) would clash with the column collation
print("DELETE ars FROM app_reservation_state ars JOIN occupation o ON o.code = ars.occupation_code WHERE o.observation = '%s';" % TAG)
print("DELETE FROM occupation WHERE observation = '%s';" % TAG)
print("DELETE FROM app_invoice_meta WHERE code_facture LIKE 'DMO-%';")
print("DELETE FROM facture WHERE code_facture LIKE 'DMO-%';")
print("DELETE FROM app_finance_transaction WHERE reference_code LIKE 'DEMO-%';")

# rooms: all ready, then a few under cleaning or maintenance
state = {code: ("Disponible", "Prêt") for code, _ in rooms}
state.update({code: ("Nettoyage", "Nettoyage") for code, _ in cleaning})
state.update({code: ("Maintenance", "Prêt") for code, _ in maintenance})
insert("app_room_status", "code_chambre, status_label, cleaning_status",
       ["('%s', '%s', '%s')" % (code, s, c) for code, (s, c) in state.items()],
       " ON DUPLICATE KEY UPDATE status_label = VALUES(status_label), cleaning_status = VALUES(cleaning_status)")

# stays: each room is booked back to back with short gaps, from 3 weeks ago to 2 weeks ahead (about 70 % occupancy)
stays, states, invoices, metas = [], [], [], []
code = FIRST_CODE
for room, price in bookable:
    start = -21 - rng.randint(0, 4)
    while True:
        start += rng.choice([0, 0, 1, 1, 2, 3])          # gap before the next guest
        nights = rng.choice([1, 2, 2, 3, 3, 4, 5, 7])
        end = start + nights
        if start > 14:
            break
        if end <= -21:
            start = end
            continue
        if end <= 0:
            status = "Check-out"
        elif start <= 0:
            status = "Check-in"
        elif start <= 2:
            status = "En attente"                         # arrivals of the next days, to confirm
        else:
            status = "Confirmée"
        client = clients[(code - FIRST_CODE) % len(clients)]
        amount = price * nights
        invoice = "NULL"
        if start <= 0:                                    # guests already arrived are invoiced at check-in
            invoice = "'DMO-%04d'" % (len(invoices) + 1)
            paid = end <= 0
            invoices.append("(%s, %s, %s, 0, %d, %d, %d, %d, 1)"
                            % (invoice, client, day(start, "14:30:00"), amount, amount, amount if paid else 0, 1 if paid else 0))
            metas.append("(%s, '%s')" % (invoice, "PAYEE" if paid else "EMISE"))
        stays.append("(%d, %s, '%s', %s, %s, 'Actif', 'NUITE', %d, %s, '%s')"
                     % (code, client, room, day(start, "14:00:00"), day(end, "12:00:00"), nights, invoice, TAG))
        states.append("(%d, '%s', %d, NOW())" % (code, status, amount))
        code += 1
        start = end

insert("facture", "code_facture, code_client, date_facture, remise, total, net, total_paye, paye, code_depot", invoices)
insert("app_invoice_meta", "code_facture, statut", metas)
insert("occupation", "code, code_client, code_chambre, date_debut, date_fin, status, type_service, qte, code_facture, observation", stays)
insert("app_reservation_state", "occupation_code, status_label, total_amount, created_at", states)

# other income of the hotel: restaurant, bar and services, every day of the last month
labels = [("Restaurant", "Ventes du restaurant", 90000, 260000), ("Bar", "Ventes du bar", 40000, 150000),
          ("Services", "Blanchisserie et transferts", 10000, 60000)]
income = []
for offset in range(-30, 1):
    for category, text, low, high in labels:
        income.append("('Entrée', '%s', '%s', %d, DATE_ADD(CURRENT_DATE(), INTERVAL %d DAY), 'DEMO-%s-%d')"
                      % (category, text, rng.randrange(low, high, 500), offset, category[:3].upper(), offset + 30))
insert("app_finance_transaction", "transaction_type, category_name, description_text, amount_value, transaction_date, reference_code", income)
print("COMMIT;")
