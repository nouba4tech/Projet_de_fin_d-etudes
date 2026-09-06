import mysql.connector
import os

def run_import():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="bd_mirador",
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        # Read the file with ANSI encoding (Windows-1252)
        with open('data-seed.sql', 'r', encoding='cp1252') as f:
            sql = f.read()
            
        # Split by semicolon but be careful with multiline
        # Actually, it's better to use the mysql client if possible but with right encoding
        # Let's try to write the file as UTF-8 without BOM first
        with open('data-seed-clean.sql', 'w', encoding='utf-8') as f:
            f.write(sql)
            
        print("File converted to clean UTF-8.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_import()
