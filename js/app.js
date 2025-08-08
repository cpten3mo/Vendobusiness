document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionModalEl = document.getElementById('transaction-modal');
    const transactionModal = new bootstrap.Modal(transactionModalEl);
    const motorwashTab = document.getElementById('motorwash-tab');
    const pisowifiTab = document.getElementById('pisowifi-tab');
    const transactionBusiness = document.getElementById('transaction-business');
    const transactionType = document.getElementById('transaction-type');
    const transactionCategory = document.getElementById('transaction-category');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let charts = {};

    const categories = {
        MotorWash: {
            Income: ['Wash', 'Vaccum', 'Others'],
            Expense: ['Maintenance', 'Water', 'Electricity']
        },
        PisoWifi: {
            Income: ['Sales'],
            Expense: ['Internet Subscription', 'Electricity', 'Maintenance']
        }
    };

    const getTransactions = (business) => {
        if (!business) return transactions;
        return transactions.filter(t => t.business === business);
    };

    const saveTransactions = () => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    };

    const addTransaction = (transaction) => {
        transactions.push({ ...transaction, id: Date.now() });
        saveTransactions();
    };

    const updateTransaction = (updatedTransaction) => {
        transactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
        saveTransactions();
    };

    const deleteTransaction = (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
        }
    };

    const exportToCSV = (business) => {
        const data = getTransactions(business);
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${business.toLowerCase()}-transactions.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const importFromCSV = (file, business) => {
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const importedTransactions = results.data.map(row => ({
                    ...row,
                    amount: parseFloat(row.amount),
                    id: Date.now() + Math.random(),
                    business: business
                }));
                transactions = [...transactions, ...importedTransactions.filter(it => it.date && it.type && it.category && it.amount)];
                saveTransactions();
                renderUI(business);
            }
        });
    };

    const populateCategoryDropdown = () => {
        const business = transactionBusiness.value;
        const type = transactionType.value;
        const options = categories[business][type] || [];
        transactionCategory.innerHTML = options.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    };

    const handleEdit = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            document.getElementById('transaction-id').value = tx.id;
            document.getElementById('transaction-date').value = tx.date;
            transactionBusiness.value = tx.business;
            transactionType.value = tx.type;
            populateCategoryDropdown();
            transactionCategory.value = tx.category;
            document.getElementById('transaction-description').value = tx.description;
            document.getElementById('transaction-amount').value = tx.amount;
            transactionModal.show();
        }
    };

    const calculateMetrics = (business) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const businessTransactions = getTransactions(business);

        const getSum = (txs, type) => txs.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);

        // Monthly
        const thisMonthTxs = businessTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });
        const lastMonthTxs = businessTransactions.filter(t => {
            const txDate = new Date(t.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === yearOfLastMonth;
        });

        const monthlyIncome = getSum(thisMonthTxs, 'Income');
        const monthlyExpenses = getSum(thisMonthTxs, 'Expense');
        const monthlyProfit = monthlyIncome - monthlyExpenses;

        const lastMonthIncome = getSum(lastMonthTxs, 'Income');
        const lastMonthProfit = lastMonthIncome - getSum(lastMonthTxs, 'Expense');
        const monthlyComparison = lastMonthIncome === 0 ? (monthlyIncome > 0 ? 100 : 0) : ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100;
        const monthlyProfitComparison = lastMonthProfit === 0 ? (monthlyProfit > 0 ? 100 : 0) : ((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100;


        // Yearly
        const thisYearTxs = businessTransactions.filter(t => new Date(t.date).getFullYear() === currentYear);
        const ytdProfit = getSum(thisYearTxs, 'Income') - getSum(thisYearTxs, 'Expense');

        // Expense Breakdown
        const expenseBreakdown = thisMonthTxs.filter(t => t.type === 'Expense').reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        return {
            monthlyIncome,
            monthlyExpenses,
            monthlyProfit,
            ytdProfit,
            monthlyComparison,
            monthlyProfitComparison,
            expenseBreakdown,
            businessTransactions
        };
    };

    const renderChart = (ctx, type, data, options) => {
        if (charts[ctx.canvas.id]) {
            charts[ctx.canvas.id].destroy();
        }
        charts[ctx.canvas.id] = new Chart(ctx, { type, data, options });
    };

    const renderMotorWashCharts = (metrics) => {
        const monthlyTrendCtx = document.getElementById('mw-monthly-trend-chart').getContext('2d');
        const expenseBreakdownCtx = document.getElementById('mw-expense-breakdown-chart').getContext('2d');

        const monthlyData = {
            labels: ['Income', 'Expenses', 'Profit'],
            datasets: [{
                label: 'Amount',
                data: [metrics.monthlyIncome, metrics.monthlyExpenses, metrics.monthlyProfit],
                backgroundColor: ['#28a745', '#dc3545', '#007bff']
            }]
        };
        renderChart(monthlyTrendCtx, 'bar', monthlyData, { responsive: true });

        const expenseData = {
            labels: Object.keys(metrics.expenseBreakdown),
            datasets: [{
                data: Object.values(metrics.expenseBreakdown),
                backgroundColor: ['#ffc107', '#fd7e14', '#20c997']
            }]
        };
        renderChart(expenseBreakdownCtx, 'pie', expenseData, { responsive: true });
    };

    const renderPisoWifiCharts = (metrics) => {
        const netProfitCtx = document.getElementById('pw-monthly-net-profit-chart').getContext('2d');
        const subscriptionCtx = document.getElementById('pw-internet-subscription-chart').getContext('2d');

        const monthlyProfitData = Array(12).fill(0);
        metrics.businessTransactions.forEach(tx => {
            const month = new Date(tx.date).getMonth();
            if (tx.type === 'Income') monthlyProfitData[month] += tx.amount;
            else monthlyProfitData[month] -= tx.amount;
        });

        renderChart(netProfitCtx, 'line', {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Net Profit',
                data: monthlyProfitData,
                borderColor: '#007bff',
                fill: false
            }]
        }, { responsive: true });

        const subscriptionData = Array(12).fill(0);
        metrics.businessTransactions.filter(t => t.category === 'Internet Subscription').forEach(tx => {
            const month = new Date(tx.date).getMonth();
            subscriptionData[month] += tx.amount;
        });
        renderChart(subscriptionCtx, 'bar', {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Internet Subscription Cost',
                data: subscriptionData,
                backgroundColor: '#6c757d'
            }]
        }, { responsive: true });
    };

    const renderMotorWashUI = (metrics) => {
        document.getElementById('mw-monthly-income').textContent = `₱${metrics.monthlyIncome.toFixed(2)}`;
        document.getElementById('mw-monthly-expenses').textContent = `₱${metrics.monthlyExpenses.toFixed(2)}`;
        document.getElementById('mw-monthly-profit').textContent = `₱${metrics.monthlyProfit.toFixed(2)}`;
        document.getElementById('mw-ytd-profit').textContent = `₱${metrics.ytdProfit.toFixed(2)}`;
        renderMotorWashCharts(metrics);
    };

    const renderPisoWifiUI = (metrics) => {
        document.getElementById('pw-monthly-net-profit').textContent = `₱${metrics.monthlyProfit.toFixed(2)}`;
        document.getElementById('pw-ytd-net-profit').textContent = `₱${metrics.ytdProfit.toFixed(2)}`;
        document.getElementById('pw-monthly-comparison').textContent = `${metrics.monthlyProfitComparison.toFixed(2)}%`;
        // Yearly comparison for PisoWifi is based on net profit, so we need to calculate it
        const lastYearProfit = calculateMetrics('PisoWifi', new Date().getFullYear() - 1).ytdProfit;
        const yearlyProfitComparison = lastYearProfit === 0 ? (metrics.ytdProfit > 0 ? 100 : 0) : ((metrics.ytdProfit - lastYearProfit) / lastYearProfit) * 100;
        document.getElementById('pw-yearly-comparison').textContent = `${yearlyProfitComparison.toFixed(2)}%`;
        renderPisoWifiCharts(metrics);
    };

    const renderTransactions = (business) => {
        const tableBodyId = business === 'MotorWash' ? 'mw-transactions-table' : 'pw-transactions-table';
        const tableBody = document.querySelector(`#${tableBodyId} tbody`);
        tableBody.innerHTML = '';
        const businessTransactions = getTransactions(business).sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const tx of businessTransactions) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tx.date}</td>
                <td>${tx.type}</td>
                <td>${tx.category}</td>
                <td>${tx.description}</td>
                <td>₱${tx.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="app.handleEdit(${tx.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="app.handleDelete(${tx.id}, '${business}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    };

    const renderUI = (business) => {
        renderTransactions(business);
        const metrics = calculateMetrics(business);
        if (business === 'MotorWash') {
            renderMotorWashUI(metrics);
        } else if (business === 'PisoWifi') {
            renderPisoWifiUI(metrics);
        }
    };

    // Initial render
    const activeTab = document.querySelector('.nav-link.active').getAttribute('aria-controls').replace('-content', '');
    renderUI(activeTab === 'motorwash' ? 'MotorWash' : 'PisoWifi');


    // Event Listeners
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('transaction-id').value;
        const transactionData = {
            date: document.getElementById('transaction-date').value,
            business: transactionBusiness.value,
            type: transactionType.value,
            category: transactionCategory.value,
            description: document.getElementById('transaction-description').value,
            amount: parseFloat(document.getElementById('transaction-amount').value)
        };

        if (id) {
            updateTransaction({ ...transactionData, id: Number(id) });
        } else {
            addTransaction(transactionData);
        }

        transactionModal.hide();
        transactionForm.reset();
        renderUI(transactionData.business);
    });

    transactionModalEl.addEventListener('show.bs.modal', (event) => {
        // First, reset the form to a clean state
        transactionForm.reset();
        document.getElementById('transaction-id').value = '';

        const button = event.relatedTarget;
        // Check if the modal was triggered by a button with business data
        if (button && button.hasAttribute('data-business')) {
            const business = button.getAttribute('data-business');
            transactionBusiness.value = business;
        }

        // Now, populate the categories based on the (potentially new) business
        populateCategoryDropdown();
    });

    transactionBusiness.addEventListener('change', populateCategoryDropdown);
    transactionType.addEventListener('change', populateCategoryDropdown);

    motorwashTab.addEventListener('shown.bs.tab', () => renderUI('MotorWash'));
    pisowifiTab.addEventListener('shown.bs.tab', () => renderUI('PisoWifi'));

    document.getElementById('export-mw-csv').addEventListener('click', () => exportToCSV('MotorWash'));
    document.getElementById('export-pw-csv').addEventListener('click', () => exportToCSV('PisoWifi'));

    document.getElementById('import-mw-csv').addEventListener('click', () => document.getElementById('import-mw-csv-input').click());
    document.getElementById('import-pw-csv').addEventListener('click', () => document.getElementById('import-pw-csv-input').click());

    document.getElementById('import-mw-csv-input').addEventListener('change', (e) => importFromCSV(e.target.files[0], 'MotorWash'));
    document.getElementById('import-pw-csv-input').addEventListener('change', (e) => importFromCSV(e.target.files[0], 'PisoWifi'));

    window.app = {
        handleEdit,
        handleDelete: (id, business) => {
            deleteTransaction(id);
            renderUI(business);
        }
    };
});
