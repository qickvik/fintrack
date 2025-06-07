//Класс для транзакции
class Transaction {
    constructor(id, type, category, amount, date, comment = "") {
        this.id = id;
        this.type = type;
        this.category = category;
        this.amount = amount;
        this.date = date;
        this.comment = comment;
    }
}

//Категории
const categories = {
    income: [
        "Зарплата",
        "Фриланс",
        "Инвестиции",
        "Подарки",
        "Прочие доходы"
    ],
    expense: [
        "Продукты",
        "Транспорт",
        "Жилье",
        "Развлечения",
        "Здоровье",
        "Одежда",
        "Образование",
        "Техника",
        "Подарки",
        "Прочие расходы"
    ]
};

//DOM элементы
const transactionsTable = document.getElementById('transactions-list');
const addTransactionBtn = document.getElementById('add-transaction');
const modal = document.getElementById('transaction-modal');
const closeBtn = document.querySelector('.close');
const transactionForm = document.getElementById('transaction-form');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');
const balanceElement = document.getElementById('balance');
const totalIncomeElement = document.getElementById('total-income');
const totalExpenseElement = document.getElementById('total-expense');
const topCategoriesChart = document.getElementById('top-categories-chart');
const modalTitle = document.getElementById('modal-title');
const editIdInput = document.getElementById('edit-id');
const notification = document.getElementById('notification');

//Состояние приложения
let transactions = [];
let isEditing = false;
let currentEditId = null;

//Инициализация приложения
function init() {
    loadTransactions();
    renderTransactions();
    updateSummary();
    renderTopCategories();
    setupEventListeners();
    populateCategorySelects();
}

//Загрузка транзакций из localStorage
function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

//Сохранение транзакций в localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

//Настройка обработчиков событий
function setupEventListeners() {
    addTransactionBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    transactionForm.addEventListener('submit', handleFormSubmit);
    
    filterType.addEventListener('change', () => {
        renderTransactions();
        renderTopCategories();
    });
    
    filterCategory.addEventListener('change', renderTransactions);
    sortBy.addEventListener('change', renderTransactions);
}

//Открытие модального окна для добавления
function openAddModal() {
    isEditing = false;
    currentEditId = null;
    modalTitle.textContent = "Добавить операцию";
    transactionForm.reset();
    editIdInput.value = "";
    updateCategoryOptions();
    document.getElementById('date').valueAsDate = new Date();
    modal.style.display = "block";
}

//Открытие модального окна для редактирования
function openEditModal(id) {
    isEditing = true;
    currentEditId = id;
    modalTitle.textContent = "Редактировать операцию";
    
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('date').value = transaction.date;
        document.getElementById('comment').value = transaction.comment || "";
        editIdInput.value = transaction.id;
        
        updateCategoryOptions();
        document.getElementById('category').value = transaction.category;
    }
    
    modal.style.display = "block";
}

//Обновление вариантов категорий в зависимости от типа операции
function updateCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const categorySelect = document.getElementById('category');
    
    categorySelect.innerHTML = '';
    
    const currentCategories = categories[type];
    currentCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

//Закрытие модального окна
function closeModal() {
    modal.style.display = "none";
}

//Обработка отправки формы
function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="type"]:checked').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const comment = document.getElementById('comment').value;
    const id = isEditing ? parseInt(editIdInput.value) : Date.now();
    
    if (isEditing) {
        //Редактирование существующей транзакции
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = new Transaction(id, type, category, amount, date, comment);
            showNotification("Транзакция успешно обновлена");
        }
    } else {
        //Добавление новой транзакции
        transactions.push(new Transaction(id, type, category, amount, date, comment));
        showNotification("Транзакция успешно добавлена");
    }
    
    saveTransactions();
    renderTransactions();
    updateSummary();
    renderTopCategories();
    closeModal();
}

//Отображение транзакций в таблице
function renderTransactions() {
    const typeFilter = filterType.value;
    const categoryFilter = filterCategory.value;
    const sortValue = sortBy.value;
    
    //Фильтрация
    let filteredTransactions = [...transactions];
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    //Сортировка
    filteredTransactions.sort((a, b) => {
        switch (sortValue) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return b.amount - a.amount;
            case 'amount-asc':
                return a.amount - b.amount;
            default:
                return 0;
        }
    });
    
    //Очистка таблицы
    transactionsTable.innerHTML = '';
    
    //Заполнение таблицы
    if (filteredTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center;">Нет транзакций для отображения</td>`;
        transactionsTable.appendChild(row);
    } else {
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            const formattedDate = new Date(transaction.date).toLocaleDateString('ru-RU');
            const formattedAmount = transaction.amount.toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + ' ₽';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type}">${formattedAmount}</td>
                <td>${transaction.comment || '-'}</td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="openEditModal(${transaction.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            transactionsTable.appendChild(row);
        });
    }
}

//Удаление транзакции
function deleteTransaction(id) {
    if (confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactions();
        updateSummary();
        renderTopCategories();
        showNotification("Транзакция успешно удалена");
    }
}

//Обновление сводной информации
function updateSummary() {
    const incomes = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = incomes - expenses;
    
    totalIncomeElement.textContent = incomes.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';
    
    totalExpenseElement.textContent = expenses.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';
    
    balanceElement.textContent = balance.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';
    
    //Цвет баланса в зависимости от значения
    if (balance > 0) {
        balanceElement.style.color = 'var(--income-color)';
    } else if (balance < 0) {
        balanceElement.style.color = 'var(--expense-color)';
    } else {
        balanceElement.style.color = 'var(--neutral-color)';
    }
}

//Отображение топ-5 категорий расходов
function renderTopCategories() {
    //Получаем только расходы
    const expenses = transactions.filter(t => t.type === 'expense');
    
    //Группируем по категориям
    const categoriesMap = {};
    
    expenses.forEach(expense => {
        if (!categoriesMap[expense.category]) {
            categoriesMap[expense.category] = 0;
        }
        categoriesMap[expense.category] += expense.amount;
    });
    
    //Преобразуем в массив и сортируем
    const categoriesArray = Object.entries(categoriesMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Только топ-5
    
    //Очищаем контейнер
    topCategoriesChart.innerHTML = '';
    
    if (categoriesArray.length === 0) {
        topCategoriesChart.innerHTML = '<p>Нет данных о расходах</p>';
        return;
    }
    
    //Находим максимальную сумму для масштабирования
    const maxAmount = Math.max(...categoriesArray.map(c => c.amount));
    
    //Создаем элементы для каждой категории
    categoriesArray.forEach(category => {
        const percentage = (category.amount / maxAmount) * 100;
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-bar';
        
        categoryElement.innerHTML = `
            <div class="category-name">${category.name}</div>
            <div class="bar-container">
                <div class="bar" style="width: ${percentage}%"></div>
            </div>
            <div class="category-amount">${category.amount.toLocaleString('ru-RU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} ₽</div>
        `;
        
        topCategoriesChart.appendChild(categoryElement);
    });
}

//Заполнение выпадающих списков категорий
function populateCategorySelects() {
    //Для фильтра
    const filterCategorySelect = document.getElementById('filter-category');
    
    //Очищаем и добавляем "Все категории"
    filterCategorySelect.innerHTML = '<option value="all">Все категории</option>';
    
    //Добавляем все возможные категории
    const allCategories = [...categories.income, ...categories.expense];
    const uniqueCategories = [...new Set(allCategories)];
    
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategorySelect.appendChild(option);
    });
    
    //Для формы (будет обновляться динамически)
    updateCategoryOptions();
    
    //Навешиваем обработчик изменения типа операции
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', updateCategoryOptions);
    });
}

//Показ уведомления
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification show';
    if (isError) {
        notification.classList.add('error');
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

//Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', init);

//Глобальные функции для использования в HTML
window.openEditModal = openEditModal;
window.deleteTransaction = deleteTransaction;