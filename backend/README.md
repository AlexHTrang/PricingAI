# RMG Dynamic Pricing Backend

This is the backend service for the RMG Dynamic Pricing application. It provides APIs for SKU management and price impact analysis.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
```

The server will start at http://localhost:8000

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### SKU Management
- `GET /api/skus` - Get all SKUs
- `GET /api/skus/search` - Search SKUs with filters
- `GET /api/skus/{sku_name}` - Get SKU by name

### Price Analysis
- `POST /api/pricing/calculate-impact` - Calculate price change impact for a single SKU
- `POST /api/pricing/analyze-market` - Analyze market-wide impact of multiple price changes

## Data Structure

The application uses a CSV file (`data/skus.csv`) to store SKU data with the following fields:
- name
- ownership
- category
- segment
- volume
- customer_price
- gp
- volume_sold
- price_elasticity
- price
- rsv
- gp_mass
- volume_share
- value_share
- unit_sold

## Price Calculator

The `PriceCalculator` class in `pricing/calculator.py` provides methods for:
- Calculating price change impact on individual SKUs
- Analyzing market-wide impact of price changes
- Computing new market shares and volume changes 