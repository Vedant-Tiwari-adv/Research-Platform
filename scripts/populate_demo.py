import pandas as pd
import requests
import json
import os

# Configuration
CSV_PATH = "c:/Personal/Educational/Projects/CPPE Project/Dataset/amazon_products.csv"
API_URL = "http://localhost:8000/api/upload"
SAMPLE_SIZE = 50 # Small sample for demo speed

def populate():
    print(f"Reading dataset from {CSV_PATH}...")
    
    # Read a sample of the CSV
    try:
        # Use chunksize to read a small part of the big file
        df_iter = pd.read_csv(CSV_PATH, chunksize=SAMPLE_SIZE)
        df = next(df_iter)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Mapping {len(df)} products to Research Paper schema...")
    
    # Map Amazon columns to Paper columns
    # Amazon: asin,title,imgUrl,productURL,stars,reviews,price,listPrice,category_id,isBestSeller,boughtInLastMonth
    
    # We create a temporary CSV to send to the /api/upload endpoint
    mapped_df = pd.DataFrame()
    mapped_df['title'] = df['title']
    mapped_df['abstract'] = df.apply(lambda r: f"Product Category ID: {r['category_id']}. This item has {r['stars']} stars and costs ${r['price']}. Best seller: {r['isBestSeller']}.", axis=1)
    mapped_df['authors'] = "Amazon Seller"
    mapped_df['year'] = 2024
    mapped_df['journal'] = df['category_id'].map(lambda x: f"Amazon Category {x}")
    mapped_df['doi'] = df['asin'].map(lambda x: f"10.amazon/{x}")
    mapped_df['cluster'] = "Commercial Products"
    mapped_df['open_access'] = True
    mapped_df['citations'] = df['reviews'].fillna(0).astype(int)

    temp_csv = "temp_populated.csv"
    mapped_df.to_csv(temp_csv, index=False)
    
    print(f"Uploading mapped data to {API_URL}...")
    try:
        with open(temp_csv, 'rb') as f:
            files = {'file': (temp_csv, f, 'text/csv')}
            response = requests.post(API_URL, files=files)
            
        if response.status_code == 200:
            print("Successfully populated data!")
            print(response.json())
        else:
            print(f"Failed to populate data: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request error: {e}")
    finally:
        if os.path.exists(temp_csv):
            os.remove(temp_csv)

if __name__ == "__main__":
    populate()
