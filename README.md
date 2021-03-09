# COMP 3512 (Winter 2021)
### Assignment #1: Single-Page App

I'm so sorry that you have to read my spaghetti, Randy.

Hosted at https://okold.github.io/comp3512-a1/

## Known Issues

- Upon my (last minute) discovery that Charts.js doesn't actually have a candlestick, I downloaded and fought with the chartsjs-financials extension. In the end, I decided to switch to ECharts just for the one graph, and it's pretty wonky right now.
- The single-file mass of 500 lines of code terrifies me, there's got to be a better way. I should encapsulate groups of functions into objects, but alas, it's 11:30PM right now.
- Resizing the window in the chart view is no bueno. The chart view in general can be kinda gross at low resolutions. I mostly tested this at 1080p.
- Sorting the stock data could be better, with little arrows indicating what you're sorting by.
