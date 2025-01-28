import matplotlib.pyplot as plt
import pandas as pd
import random

# Generate dummy data for candlestick charts
def generate_candlestick_data(num_candles):
    data = []
    for i in range(num_candles):
        open_price = random.uniform(100, 200)
        close_price = random.uniform(100, 200)
        high_price = max(open_price, close_price) + random.uniform(0, 20)
        low_price = min(open_price, close_price) - random.uniform(0, 20)
        data.append([open_price, high_price, low_price, close_price])
    return pd.DataFrame(data, columns=["Open", "High", "Low", "Close"])

# Create three candlestick patterns
data_bullish_engulfing = pd.DataFrame([
    [150, 160, 145, 155],  # Small red candle
    [140, 170, 135, 165],  # Large green candle engulfing previous
], columns=["Open", "High", "Low", "Close"])

data_bearish_engulfing = pd.DataFrame([
    [165, 175, 160, 170],  # Small green candle
    [175, 180, 150, 155],  # Large red candle engulfing previous
], columns=["Open", "High", "Low", "Close"])

data_hammer = pd.DataFrame([
    [150, 155, 130, 152],  # Hammer pattern
    [152, 162, 140, 155],
], columns=["Open", "High", "Low", "Close"])

# Function to plot candlestick chart
def plot_candlestick(data, title):
    fig, ax = plt.subplots(figsize=(8, 5))
    for i, row in data.iterrows():
        color = 'green' if row['Close'] > row['Open'] else 'red'
        ax.plot([i, i], [row['Low'], row['High']], color='black')  # High-Low line
        ax.bar(i, abs(row['Close'] - row['Open']), bottom=min(row['Open'], row['Close']), color=color, width=0.5)
    ax.set_title(title)
    ax.set_xticks(range(len(data)))
    ax.set_xticklabels([])
    ax.set_ylabel("Price")
    plt.show()

# Plot the patterns
plot_candlestick(data_bullish_engulfing, "Bullish Engulfing Pattern")
plot_candlestick(data_bearish_engulfing, "Bearish Engulfing Pattern")
plot_candlestick(data_hammer, "Hammer Pattern")
