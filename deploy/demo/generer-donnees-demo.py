"""Generates donnees-demo.sql: realistic demo data for the dashboard of the online version (database bd_mirador).

Every date is written relative to CURRENT_DATE(), so the same SQL file can be run again on the morning of a demo:
it first deletes the rows it created last time (tagged DEMO-MIRADOR / DMO- / DEMO-), then recreates them around
the new date. Real data is never touched, except the cleaning/maintenance state of the rooms, which is reset.

Usage:  python generer-donnees-demo.py <room codes file> > donnees-demo.sql
        (room codes file: one free room code per line, rooms that hold no real reservation)
"""
import random
import sys

sys.stdout.reconfigure(encoding="utf-8", newline="\n")   # accents (Prêt, Entrée...) must reach MySQL as UTF-8

TAG = "DEMO-MIRADOR"
rng = random.Random(2026)
rooms = [line.strip() for line in open(sys.argv[1], encoding="utf-8") if line.strip()]

maintenance = rooms[-3:]                 # 3 rooms under maintenance
cleaning = rooms[-7:-3]                  # 4 rooms being cleaned
bookable = rooms[:-7]

out = []
w = out.append
w("-- Donnees de demonstration du tableau de bord (generees par generer-donnees-demo.py). Relancable.")
# the tag is written as a literal: a user variable (@tag) would clash with the column collation
w("DELETE ars FROM app_reservation_state ars JOIN occupation o ON o.code = ars.occupation_code WHERE o.observation = '%s';" % TAG)
w("DELETE FROM occupation WHERE observation = '%s';" % TAG)
w("DELETE FROM app_invoice_meta WHERE code_facture LIKE 'DMO-%';")
w("DELETE FROM facture WHERE code_facture LIKE 'DMO-%';")
w("DELETE FROM app_finance_transaction WHERE reference_code LIKE 'DEMO-%';")


def day(offset, time):
    return "TIMESTAMP(DATE_ADD(CURRENT_DATE(), INTERVAL %d DAY), '%s')" % (offset, time)


# rooms: all ready, then a few under cleaning or maintenance
quoted = ",".join("'%s'" % r for r in rooms)
w("INSERT INTO app_room_status (code_chambre, status_label, cleaning_status) SELECT code_chambre, 'Disponible', 'Prêt' "
  "FROM chambre WHERE code_chambre IN (%s) ON DUPLICATE KEY UPDATE status_label = 'Disponible', cleaning_status = 'Prêt';" % quoted)
for r in cleaning:
    w("UPDATE app_room_status SET status_label = 'Nettoyage', cleaning_status = 'Nettoyage' WHERE code_chambre = '%s';" % r)
for r in maintenance:
    w("UPDATE app_room_status SET status_label = 'Maintenance', cleaning_status = 'Prêt' WHERE code_chambre = '%s';" % r)

# stays: each room is booked back to back with short gaps, from 3 weeks ago to 2 weeks ahead (about 70 % occupancy)
invoice = 0
client_slot = 0
for room in bookable:
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
        client_slot += 1
        client = "(SELECT code_client FROM client ORDER BY code_client LIMIT 1 OFFSET %d)" % (client_slot % 100)
        price = "(SELECT GREATEST(COALESCE(t.nuite, 0), 25000) FROM chambre c LEFT JOIN type_chambre t ON t.codetype = c.code_type WHERE c.code_chambre = '%s')" % room
        code = "NULL"
        if start <= 0:                                    # guests already arrived are invoiced at check-in
            invoice += 1
            code = "'DMO-%04d'" % invoice
            paid = "%s * %d" % (price, nights) if end <= 0 else "0"
            w("INSERT INTO facture (code_facture, code_client, date_facture, remise, total, net, total_paye, paye, code_depot) "
              "SELECT %s, %s, %s, 0, p * %d, p * %d, %s, %d, 1 FROM (SELECT %s AS p) x;"
              % (code, client, day(start, "14:30:00"), nights, nights, "p * %d" % nights if end <= 0 else "0",
                 1 if end <= 0 else 0, price))
            w("INSERT INTO app_invoice_meta (code_facture, statut) VALUES (%s, '%s');" % (code, "PAYEE" if end <= 0 else "EMISE"))
        w("INSERT INTO occupation (code_client, code_chambre, date_debut, date_fin, status, type_service, qte, code_facture, observation) "
          "VALUES (%s, '%s', %s, %s, 'Actif', 'NUITE', %d, %s, '%s');"
          % (client, room, day(start, "14:00:00"), day(end, "12:00:00"), nights, code, TAG))
        w("INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at) "
          "SELECT LAST_INSERT_ID(), '%s', %s * %d, NOW();" % (status, price, nights))
        start = end

# other income of the hotel: restaurant, bar and services, every day of the last month
labels = [("Restaurant", "Ventes du restaurant", 90000, 260000), ("Bar", "Ventes du bar", 40000, 150000),
          ("Services", "Blanchisserie et transferts", 10000, 60000)]
for offset in range(-30, 1):
    for category, text, low, high in labels:
        amount = rng.randrange(low, high, 500)
        w("INSERT INTO app_finance_transaction (transaction_type, category_name, description_text, amount_value, transaction_date, reference_code) "
          "VALUES ('Entrée', '%s', '%s', %d, DATE_ADD(CURRENT_DATE(), INTERVAL %d DAY), 'DEMO-%s-%d');"
          % (category, text, amount, offset, category[:3].upper(), offset + 30))

print("\n".join(out))
