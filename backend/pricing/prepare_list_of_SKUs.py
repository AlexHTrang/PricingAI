import pandas as pd
import re

# Load the Excel file with the specific tab
file_path = '../data/Combined Data.xlsx'
tab_name = 'TBL_Nielsen_Unit_Sales_Extract'

try:
    df_SKU = pd.read_excel(file_path, sheet_name=tab_name)
    print(f'Successfully loaded {tab_name} from {file_path}')
    
    # Clean up pack size
    def clean_pack_size(pack_size):
        if pd.isna(pack_size):
            return None
        
        # Convert to string
        pack_size = str(pack_size).strip().upper()
        
        # Extract numbers using regex
        numbers = re.findall(r'\d+\.?\d*', pack_size)
        if numbers:
            return float(numbers[0])
        return None

    # Clean up unit size
    def clean_unit_size(unit_size):
        if pd.isna(unit_size):
            return None
        
        # Convert to string
        unit_size = str(unit_size).strip().upper()
        
        # Extract number and unit
        number_match = re.findall(r'\d+\.?\d*', unit_size)
        if not number_match:
            return None
            
        number = float(number_match[0])
        
        # Convert common units to ml/g
        if 'L' in unit_size:
            number *= 1000  # Convert L to ml
        elif 'KG' in unit_size:
            number *= 1000  # Convert kg to g
            
        return number

    # Create new cleaned columns
    df_SKU['PackSizeCleaned'] = df_SKU['PACK SIZE'].apply(clean_pack_size)
    df_SKU['UnitSizeCleaned'] = df_SKU['UNIT SIZE'].apply(clean_unit_size)
    
    # Filter for dates in 2025
    df_SKU['DATE'] = pd.to_datetime(df_SKU['DATE'])
    df_SKU_2025 = df_SKU[df_SKU['DATE'].dt.year == 2025].copy()
    
    # Calculate volume for each row
    df_SKU_2025['VolumeSold'] = df_SKU_2025['PackSizeCleaned'] * df_SKU_2025['UnitSizeCleaned'] * df_SKU_2025['Sales Unit']
    
    # Create aggregations
    agg_functions = {
        'Sales Price per Unit': 'mean',
        'Sales Unit': 'sum',
        'VolumeSold': 'sum'
    }
    
    df_aggregated = df_SKU_2025.groupby(['ITEM', 'Level_1', 'Level_3', 'PackSizeCleaned', 'UnitSizeCleaned']).agg(agg_functions).reset_index()
    
    # Calculate total volume sold
    total_volume = df_aggregated['VolumeSold'].sum()
    
    # Calculate VoMS
    df_aggregated['VoMS'] = df_aggregated['VolumeSold'] / total_volume
    
    # Rename columns for clarity
    df_aggregated = df_aggregated.rename(columns={
        'Sales Price per Unit': 'Average_Price_per_Unit',
        'Sales Unit': 'Total_Sales_Units'
    })
    
    # Display results
    print('\nAggregated Data Sample with VoMS:')
    print(df_aggregated[['ITEM', 'VolumeSold', 'VoMS']].head(10))
    print('\nAggregated Data Shape:', df_aggregated.shape)
    print(f'\nTotal Volume: {total_volume:,.2f}')
    print(f'VoMS Sum (should be 1.0): {df_aggregated["VoMS"].sum():.4f}')
    
    # Save aggregated data
    output_path = '../data/aggregated_sales_2025.csv'
    df_aggregated.to_csv(output_path, index=False)
    print(f'\nData exported successfully to: {output_path}')
    
except FileNotFoundError:
    print(f'Error: The file {file_path} was not found. Please ensure it is in the same directory as this script.')
except Exception as e:
    print(f'Error: {str(e)}')


# Save the dataframe to a CSV file
#output_file = 'SKU_list.csv'
#df_SKU.to_csv(output_file, index=False)
#print(f'Dataframe saved to {output_file}')

