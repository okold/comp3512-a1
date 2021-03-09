# COMP 3512 (Winter 2021)
### Assignment #1: Single-Page App

I'm so sorry that you have to read my spaghetti, Randy.

Hosted at https://okold.github.io/comp3512-a1/

## Known Issues

- Upon my (last minute) discovery that Chart.js doesn't actually have a candlestick, I downloaded and fought with chartjs-chart-financial. In the end, I decided to switch to ECharts just for the one graph, and it's pretty bland right now. Could use tooltips.
- The mass of 500 lines of code terrifies me. There's got to be a better way, like maybe actually using objects. I need to take the time to looks at large JS projects to see how everything is organized, and maybe not dump everything into one file again.
- Resizing the window in the chart view is no bueno. The chart view in general can be kinda gross at low resolutions. I mostly tested this at 1080p.
- Sorting the stock data could be better, with little arrows indicating what you're sorting by (and letting you flip the direction).
