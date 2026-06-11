CREATE TABLE IF NOT EXISTS roi_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    calc_type ENUM('roi', 'compound', 'simple') NOT NULL DEFAULT 'compound',
    initial_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    monthly_contribution DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2) NOT NULL,
    time_period DECIMAL(8,2) NOT NULL,
    final_value DECIMAL(15,2) NOT NULL,
    result_roi_pct DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roi_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS market_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_key VARCHAR(50) NOT NULL,
    data_json TEXT NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_market_cache_key_fetched (data_key, fetched_at)
);

INSERT INTO market_cache (data_key, data_json)
SELECT 'stocks', '[{"symbol":"NVDA","name":"NVIDIA Corporation","price":"$875.40","change":"3.02%","trend":"up"},{"symbol":"AAPL","name":"Apple Inc.","price":"$189.30","change":"1.24%","trend":"up"},{"symbol":"TSLA","name":"Tesla Inc.","price":"$172.82","change":"1.56%","trend":"down"},{"symbol":"GOOGL","name":"Alphabet Inc.","price":"$171.95","change":"0.43%","trend":"down"},{"symbol":"AMZN","name":"Amazon.com Inc.","price":"$184.70","change":"2.11%","trend":"up"}]'
WHERE NOT EXISTS (SELECT 1 FROM market_cache WHERE data_key = 'stocks');

INSERT INTO market_cache (data_key, data_json)
SELECT 'news', '[{"title":"Fed Signals Possible Rate Cut Later This Year","summary":"Federal Reserve officials hint at potential interest rate reductions if inflation continues to ease toward the 2% target.","date":"May 5, 2026","category":"Monetary Policy"},{"title":"NVIDIA Surges After Record Data Center Revenue","summary":"NVIDIA reports record-breaking quarterly earnings driven by surging demand for AI chips and data center infrastructure.","date":"May 4, 2026","category":"Technology"},{"title":"Bitcoin Breaks $62,000 as Institutional Demand Rises","summary":"Cryptocurrency markets rally as major institutional investors increase Bitcoin holdings amid growing mainstream adoption.","date":"May 3, 2026","category":"Crypto"},{"title":"Oil Prices Dip Amid Rising Global Supply","summary":"Crude oil futures fell as OPEC+ members signal plans to gradually increase production output over the coming months.","date":"May 2, 2026","category":"Commodities"}]'
WHERE NOT EXISTS (SELECT 1 FROM market_cache WHERE data_key = 'news');
