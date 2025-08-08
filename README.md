# Financial Tracking Dashboard for Vendo Machine Business

This is a responsive, client-side financial tracking dashboard for two vending machine businesses: MotorWash and PisoWifi. It allows the business owner to track income, expenses, and profitability without needing a backend server. All data is stored in the browser's `localStorage`.

## Features

- **Transaction Management**: Add, edit, and delete financial transactions for each business.
- **Data Persistence**: Data is saved in `localStorage`, so it persists across browser reloads.
- **CSV Import/Export**: Backup and restore transaction data by exporting to and importing from CSV files.
- **KPI Dashboards**: Separate dashboards for each business with key performance indicators:
    - **MotorWash**: Monthly income, expenses, profit, and year-to-date profit.
    - **PisoWifi**: Monthly net profit, year-to-date net profit, and monthly/yearly profit comparisons.
- **Visualizations**: Interactive charts powered by Chart.js to visualize financial data:
    - **MotorWash**: Monthly trends for income/expenses/profit and a breakdown of monthly expenses.
    - **PisoWifi**: Monthly net profit trend and internet subscription cost trend.
- **Responsive Design**: The dashboard is fully responsive and works on mobile devices, built with Bootstrap.

## How to Use

1.  **Open `index.html`**: Simply open the `index.html` file in a web browser.
2.  **Select a Business**: Use the tabs at the top to switch between the MotorWash and PisoWifi dashboards.
3.  **Add Transactions**: Click the "Add Transaction" button to open a modal and enter transaction details.
4.  **Manage Data**:
    - Edit or delete transactions using the buttons in the transaction table.
    - Use the "Export CSV" button to save your data.
    - Use the "Import CSV" button to load data from a CSV file.

## Technical Details

- **Frontend**: HTML, CSS, JavaScript
- **Frameworks/Libraries**: Bootstrap 5, Chart.js, PapaParse
- **Data Storage**: Browser `localStorage`
- **Hosting**: GitHub Pages compatible (static site)
