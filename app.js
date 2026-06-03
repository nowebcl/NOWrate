/* ==========================================================================
   NOWrate JavaScript Engine (Reactive & Premium Logic)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Inputs & Dynamic Subscriptions
    const netSalaryInput = document.getElementById('input-net-salary');
    const subscriptionsContainer = document.getElementById('subscriptions-container');
    const btnAddSubscription = document.getElementById('btn-add-subscription');
    const subsSubtotalSum = document.getElementById('subs-subtotal-sum');
    const subsTableHeader = document.getElementById('subs-table-header');
    
    const expRentInput = document.getElementById('input-exp-rent');
    const expUtilitiesInput = document.getElementById('input-exp-utilities');
    const expHardwareInput = document.getElementById('input-exp-hardware');
    const expOthersInput = document.getElementById('input-exp-others');
    const expenseTotalSum = document.getElementById('expense-total-sum');
    const taxSlider = document.getElementById('slider-tax');
    const vacationSlider = document.getElementById('slider-vacation');
    const hoursSlider = document.getElementById('slider-hours');
    const billableSlider = document.getElementById('slider-billable');
    const currencySelect = document.getElementById('currency-select');

    // DOM Elements - Output Values
    const taxValLabel = document.getElementById('tax-val');
    const vacationValLabel = document.getElementById('vacation-val');
    const hoursValLabel = document.getElementById('hours-val');
    const billableValLabel = document.getElementById('billable-val');
    const efficiencyNote = document.getElementById('efficiency-note');
    
    // DOM Elements - Rate Results
    const resultHourlyRate = document.getElementById('result-hourly-rate');
    const resultPremiumRate = document.getElementById('result-premium-rate');
    const resultDailyRate = document.getElementById('result-daily-rate');
    const labelDailyRate = document.getElementById('label-daily-rate');

    // DOM Elements - Details & Chart
    const detailWorkingWeeks = document.getElementById('detail-working-weeks');
    const detailBillableHours = document.getElementById('detail-billable-hours');
    const detailGrossYearly = document.getElementById('detail-gross-yearly');
    
    const chartTotalYearly = document.getElementById('chart-total-yearly');
    const segmentNet = document.getElementById('chart-segment-net');
    const segmentExpenses = document.getElementById('chart-segment-expenses');
    const segmentTaxes = document.getElementById('chart-segment-taxes');
    
    const legendValNet = document.getElementById('legend-val-net');
    const legendValExpenses = document.getElementById('legend-val-expenses');
    const legendValTaxes = document.getElementById('legend-val-taxes');

    const currencyIndicators = [
        document.getElementById('currency-indicator-net'),
        document.getElementById('result-currency')
    ];

    // Buttons
    const btnCopy = document.getElementById('btn-copy');
    const btnCopyText = document.getElementById('btn-copy-text');
    const btnPrint = document.getElementById('btn-print');
    const toast = document.getElementById('toast');

    // State Variables
    let currentCurrencySymbol = '$';
    let lastHourlyRate = 0;
    let hourlyRateAnimId = null;

    // Currency Formatting Data
    const currencySymbols = {
        CLP: '$',
        USD: '$',
        EUR: '€',
        MXN: '$',
        COP: '$',
        ARS: '$',
        GBP: '£'
    };

    /* ==========================================================================
       Formatters & Helpers
       ========================================================================== */
    
    // Parse value from raw input string (removes dots and commas)
    function parseInputValue(valStr) {
        const clean = valStr.replace(/[,.]/g, '');
        return parseFloat(clean) || 0;
    }

    // Format currency string for display (handles Chilean Peso 0 decimal standard)
    function formatCurrency(val, symbol = currentCurrencySymbol) {
        const isClp = (currencySelect.value === 'CLP');
        return `${symbol}${val.toLocaleString(isClp ? 'es-CL' : 'en-US', { 
            minimumFractionDigits: isClp ? 0 : 2, 
            maximumFractionDigits: isClp ? 0 : 2 
        })}`;
    }

    // Format integer strings (for inputs on blur)
    function formatIntegerInput(val) {
        const isClp = (currencySelect.value === 'CLP');
        return Math.round(val).toLocaleString(isClp ? 'es-CL' : 'en-US', { 
            maximumFractionDigits: 0 
        });
    }

    // Dynamic Subscriptions Config and Core List Builders (Starts empty by user request)
    const defaultSubscriptions = {
        CLP: [],
        USD: [],
        EUR: [],
        GBP: [],
        MXN: [],
        COP: [],
        ARS: []
    };

    function addSubscriptionItem(name = '', price = 0, date = '') {
        const item = document.createElement('div');
        item.className = 'subscription-item';
        const formattedPrice = formatIntegerInput(price);

        item.innerHTML = `
            <input type="text" class="sub-name-input" placeholder="Ej. Figma" value="${name}" autocomplete="off">
            <div class="sub-date-wrapper-xs">
                <input type="number" class="sub-date-input" min="1" max="31" value="${date}" placeholder="Día" title="Día de pago mensual (1-31)" autocomplete="off">
            </div>
            <div class="currency-input-wrapper-xs">
                <span class="currency-indicator-xs">${currentCurrencySymbol}</span>
                <input type="text" class="sub-price-input" value="${formattedPrice}" placeholder="0" autocomplete="off">
            </div>
            <button type="button" class="btn-delete-sub" aria-label="Eliminar suscripción">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;

        const priceInput = item.querySelector('.sub-price-input');
        const dateInput = item.querySelector('.sub-date-input');
        const btnDelete = item.querySelector('.btn-delete-sub');

        priceInput.addEventListener('focus', (e) => {
            const raw = e.target.value.replace(/[,.]/g, '');
            e.target.value = raw;
        });

        priceInput.addEventListener('input', (e) => {
            let sanitized = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = sanitized;
            calculate();
        });

        priceInput.addEventListener('blur', (e) => {
            const val = parseInputValue(e.target.value);
            e.target.value = formatIntegerInput(val);
            calculate();
        });

        dateInput.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val > 31) e.target.value = 31;
            if (val < 1) e.target.value = '';
            calculate();
        });

        btnDelete.addEventListener('click', () => {
            item.remove();
            calculate();
        });

        subscriptionsContainer.appendChild(item);
    }

    function rebuildSubscriptions(currency) {
        subscriptionsContainer.innerHTML = '';
        const subs = defaultSubscriptions[currency] || defaultSubscriptions['CLP'] || [];
        subs.forEach(sub => {
            addSubscriptionItem(sub.name, sub.price, sub.date || '');
        });
    }

    // Update range slider color fill (Premium design element)
    function updateSliderFill(slider) {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const val = parseFloat(slider.value) || 0;
        const pct = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--color-accent-purple) 0%, var(--color-accent-purple) ${pct}%, #EAEAEA ${pct}%, #EAEAEA 100%)`;
    }

    /* ==========================================================================
       Rate Counting Animation (Buttery Smooth 250ms cubic ease-out)
       ========================================================================== */
    function animateHourlyRate(targetVal) {
        if (hourlyRateAnimId) {
            cancelAnimationFrame(hourlyRateAnimId);
        }
        
        const start = lastHourlyRate;
        const end = targetVal;
        const duration = 250; 
        const startTime = performance.now();

        const isClp = (currencySelect.value === 'CLP');
        const decimals = isClp ? 0 : 2;

        if (Math.abs(start - end) < 0.05) {
            resultHourlyRate.textContent = end.toLocaleString(isClp ? 'es-CL' : 'en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            lastHourlyRate = end;
            return;
        }

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Cubic ease-out
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * ease;
            
            resultHourlyRate.textContent = current.toLocaleString(isClp ? 'es-CL' : 'en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });

            if (progress < 1) {
                hourlyRateAnimId = requestAnimationFrame(step);
            } else {
                resultHourlyRate.textContent = end.toLocaleString(isClp ? 'es-CL' : 'en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
                lastHourlyRate = end;
                hourlyRateAnimId = null;
            }
        }

        hourlyRateAnimId = requestAnimationFrame(step);
    }

    /* ==========================================================================
       Core Calculation & UI Update Engine
       ========================================================================== */
    function calculate() {
        // 1. Gather values from DOM
        const netMonthly = parseInputValue(netSalaryInput.value);
        
        // Show/hide subscriptions table header
        const subItems = subscriptionsContainer.querySelectorAll('.subscription-item');
        if (subItems.length > 0) {
            subsTableHeader.style.display = 'flex';
        } else {
            subsTableHeader.style.display = 'none';
        }

        // Sum of all dynamic subscriptions
        let expSubs = 0;
        const subPriceInputs = subscriptionsContainer.querySelectorAll('.sub-price-input');
        subPriceInputs.forEach(input => {
            expSubs += parseInputValue(input.value);
        });

        // Sum other expenses
        const expRent = parseInputValue(expRentInput.value);
        const expUtilities = parseInputValue(expUtilitiesInput.value);
        const expHardware = parseInputValue(expHardwareInput.value);
        const expOthers = parseInputValue(expOthersInput.value);
        
        const expensesMonthly = expSubs + expRent + expUtilities + expHardware + expOthers;
        
        const taxRate = parseFloat(taxSlider.value) || 0;
        const vacationWeeks = parseFloat(vacationSlider.value) || 0;
        const weeklyHours = parseFloat(hoursSlider.value) || 40;
        const billableRate = parseFloat(billableSlider.value) || 60;

        // 2. Perform Calculations
        const netAnnual = netMonthly * 12;
        const expensesAnnual = expensesMonthly * 12;
        const baseAnnualNeeded = netAnnual + expensesAnnual;
        
        // Taxes based on gross needed or simple markup? 
        // As requested: Salario Neto + Gastos Operativos + Impuestos (percentage on base)
        const taxesAnnual = baseAnnualNeeded * (taxRate / 100);
        const totalAnnualNeeded = baseAnnualNeeded + taxesAnnual;

        const workingWeeks = Math.max(0, 52 - vacationWeeks);
        const totalHoursYearly = workingWeeks * weeklyHours;
        const billableHoursYearly = totalHoursYearly * (billableRate / 100);

        // Compute rate
        let hourlyRate = 0;
        if (billableHoursYearly > 0) {
            hourlyRate = totalAnnualNeeded / billableHoursYearly;
        }

        const premiumRate = hourlyRate * 1.20;
        
        // Daily rate based on average daily hours in a 5-day week
        const hoursPerDay = weeklyHours / 5;
        const dailyRate = hourlyRate * hoursPerDay;

        // 3. Update Sliders Labels
        taxValLabel.textContent = `${taxRate}%`;
        vacationValLabel.textContent = `${vacationWeeks} ${vacationWeeks === 1 ? 'semana' : 'semanas'}`;
        hoursValLabel.textContent = `${weeklyHours} horas`;
        billableValLabel.textContent = `${billableRate}%`;
        
        const adminPercent = 100 - billableRate;
        efficiencyNote.innerHTML = `El <strong>${adminPercent}%</strong> restante se destina a tareas administrativas, reuniones y prospección no cobradas.`;

        // 4. Update Main Result with animations
        animateHourlyRate(hourlyRate);
        
        // Update subtotals and total expenses labels
        subsSubtotalSum.textContent = formatCurrency(expSubs);
        expenseTotalSum.textContent = formatCurrency(expensesMonthly);

        // 5. Update Secondary Results
        resultPremiumRate.textContent = formatCurrency(premiumRate);
        resultDailyRate.textContent = formatCurrency(dailyRate);
        labelDailyRate.textContent = `Tarifa Diaria (${hoursPerDay.toFixed(1)}h)`;

        // 6. Update Annual Details Card
        detailWorkingWeeks.textContent = `${workingWeeks} semanas`;
        detailBillableHours.textContent = `${Math.round(billableHoursYearly).toLocaleString()} hrs`;
        detailGrossYearly.textContent = formatCurrency(totalAnnualNeeded);
        
        // Center text chart
        // Limit string size in donut center
        const isClp = (currencySelect.value === 'CLP');
        let formattedYearlyTotal = totalAnnualNeeded.toLocaleString(isClp ? 'es-CL' : 'en-US', { maximumFractionDigits: 0 });
        chartTotalYearly.textContent = `${currentCurrencySymbol}${formattedYearlyTotal}`;

        // 7. Update SVG Doughnut Chart segments
        // We calculate percentage ratios of the budget
        let netPct = 0;
        let expensesPct = 0;
        let taxesPct = 0;

        if (totalAnnualNeeded > 0) {
            netPct = (netAnnual / totalAnnualNeeded) * 100;
            expensesPct = (expensesAnnual / totalAnnualNeeded) * 100;
            taxesPct = (taxesAnnual / totalAnnualNeeded) * 100;
        } else {
            netPct = 100; // default state visual fallback
        }

        // Update Legend Values
        legendValNet.textContent = `${Math.round(netPct)}%`;
        legendValExpenses.textContent = `${Math.round(expensesPct)}%`;
        legendValTaxes.textContent = `${Math.round(taxesPct)}%`;

        // Math for offsets clockwise starting at 12 o'clock (0 index)
        // Segment 1 (Net)
        segmentNet.setAttribute('stroke-dasharray', `${netPct} 100`);
        segmentNet.setAttribute('stroke-dashoffset', '0');

        // Segment 2 (Expenses)
        segmentExpenses.setAttribute('stroke-dasharray', `${expensesPct} 100`);
        segmentExpenses.setAttribute('stroke-dashoffset', `${-netPct}`);

        // Segment 3 (Taxes)
        segmentTaxes.setAttribute('stroke-dasharray', `${taxesPct} 100`);
        segmentTaxes.setAttribute('stroke-dashoffset', `${-(netPct + expensesPct)}`);
    }

    /* ==========================================================================
       Interaction Listeners
       ========================================================================== */
    
    // Listen to range sliders input for reactive calculations
    const sliders = [taxSlider, vacationSlider, hoursSlider, billableSlider];
    sliders.forEach(slider => {
        updateSliderFill(slider);
        slider.addEventListener('input', () => {
            updateSliderFill(slider);
            calculate();
        });
    });

    // Formatting currency inputs on focus and blur (Standard Premium UX pattern)
    // NOTE: Dynamic subscription fields register their own events on creation.
    const inputFields = [netSalaryInput, expRentInput, expUtilitiesInput, expHardwareInput, expOthersInput];
    inputFields.forEach(input => {
        // Strip separators on focus to allow clean edits
        input.addEventListener('focus', (e) => {
            const raw = e.target.value.replace(/[,.]/g, '');
            e.target.value = raw;
        });

        // Calculate and format commas on input
        input.addEventListener('input', (e) => {
            // Strip any non-digits
            let sanitized = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = sanitized;
            
            // Recalculate
            calculate();
        });

        // Format with commas on blur
        input.addEventListener('blur', (e) => {
            const val = parseInputValue(e.target.value);
            e.target.value = formatIntegerInput(val);
            calculate();
        });
    });

    // Add subscription row action
    btnAddSubscription.addEventListener('click', () => {
        addSubscriptionItem('', 0, '');
        
        // Auto focus the name input of the newly added row
        const newItems = subscriptionsContainer.querySelectorAll('.subscription-item');
        if (newItems.length > 0) {
            const lastItem = newItems[newItems.length - 1];
            const nameInput = lastItem.querySelector('.sub-name-input');
            if (nameInput) nameInput.focus();
        }
        calculate();
    });

    // Handle currency changes
    currencySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        currentCurrencySymbol = currencySymbols[val] || '$';
        
        // Auto-update default values based on currency to make it logical
        if (val === 'CLP') {
            netSalaryInput.value = formatIntegerInput(2500000);
            rebuildSubscriptions('CLP');
            expRentInput.value = formatIntegerInput(200000);
            expUtilitiesInput.value = formatIntegerInput(60000);
            expHardwareInput.value = formatIntegerInput(30000);
            expOthersInput.value = formatIntegerInput(10000);
        } else if (val === 'USD') {
            netSalaryInput.value = formatIntegerInput(3000);
            rebuildSubscriptions('USD');
            expRentInput.value = formatIntegerInput(250);
            expUtilitiesInput.value = formatIntegerInput(70);
            expHardwareInput.value = formatIntegerInput(20);
            expOthersInput.value = formatIntegerInput(0);
        } else if (val === 'EUR') {
            netSalaryInput.value = formatIntegerInput(3000);
            rebuildSubscriptions('EUR');
            expRentInput.value = formatIntegerInput(250);
            expUtilitiesInput.value = formatIntegerInput(60);
            expHardwareInput.value = formatIntegerInput(20);
            expOthersInput.value = formatIntegerInput(20);
        } else if (val === 'GBP') {
            netSalaryInput.value = formatIntegerInput(2500);
            rebuildSubscriptions('GBP');
            expRentInput.value = formatIntegerInput(220);
            expUtilitiesInput.value = formatIntegerInput(55);
            expHardwareInput.value = formatIntegerInput(20);
            expOthersInput.value = formatIntegerInput(10);
        } else if (val === 'MXN') {
            netSalaryInput.value = formatIntegerInput(50000);
            rebuildSubscriptions('MXN');
            expRentInput.value = formatIntegerInput(5000);
            expUtilitiesInput.value = formatIntegerInput(1200);
            expHardwareInput.value = formatIntegerInput(500);
            expOthersInput.value = formatIntegerInput(100);
        } else if (val === 'COP') {
            netSalaryInput.value = formatIntegerInput(8000000);
            rebuildSubscriptions('COP');
            expRentInput.value = formatIntegerInput(700000);
            expUtilitiesInput.value = formatIntegerInput(150000);
            expHardwareInput.value = formatIntegerInput(80000);
            expOthersInput.value = formatIntegerInput(20000);
        } else if (val === 'ARS') {
            netSalaryInput.value = formatIntegerInput(1500000);
            rebuildSubscriptions('ARS');
            expRentInput.value = formatIntegerInput(150000);
            expUtilitiesInput.value = formatIntegerInput(35000);
            expHardwareInput.value = formatIntegerInput(10000);
            expOthersInput.value = formatIntegerInput(5000);
        }
        
        // Update input prefix labels
        currencyIndicators.forEach(indicator => {
            if (indicator) indicator.textContent = currentCurrencySymbol;
        });

        const miniIndicators = document.querySelectorAll('.currency-indicator-sm');
        miniIndicators.forEach(indicator => {
            if (indicator) indicator.textContent = currentCurrencySymbol;
        });

        // Trigger recalculation to format numbers with new symbol
        calculate();
    });

    /* ==========================================================================
       Actions: Copy & Print
       ========================================================================== */
    
    // Copy summary report to clipboard
    btnCopy.addEventListener('click', () => {
        const netMonthly = parseInputValue(netSalaryInput.value);
        
        // Sum dynamic subscriptions
        let expSubs = 0;
        let subsDetailsStr = '';
        const isClp = (currencySelect.value === 'CLP');
        const locale = isClp ? 'es-CL' : 'en-US';
        
        const subItems = subscriptionsContainer.querySelectorAll('.subscription-item');
        subItems.forEach(item => {
            const name = item.querySelector('.sub-name-input').value || 'Sin nombre';
            const priceVal = parseInputValue(item.querySelector('.sub-price-input').value);
            const dateVal = item.querySelector('.sub-date-input').value;
            const dateStr = dateVal ? ` (Día ${dateVal})` : '';
            expSubs += priceVal;
            subsDetailsStr += `    * ${name}${dateStr}: ${currentCurrencySymbol}${priceVal.toLocaleString(locale)}\n`;
        });
        if (subItems.length === 0) {
            subsDetailsStr = '    * Ninguna suscripción activa\n';
        }

        // Desglose de Gastos
        const expRent = parseInputValue(expRentInput.value);
        const expUtilities = parseInputValue(expUtilitiesInput.value);
        const expHardware = parseInputValue(expHardwareInput.value);
        const expOthers = parseInputValue(expOthersInput.value);
        const expensesMonthly = expSubs + expRent + expUtilities + expHardware + expOthers;

        const taxRate = taxSlider.value;
        const vacationWeeks = vacationSlider.value;
        const weeklyHours = hoursSlider.value;
        const billableRate = billableSlider.value;

        const workingWeeks = 52 - vacationWeeks;
        const hoursPerDay = weeklyHours / 5;

        // Obtain outputs directly from text
        const hourlyRateStr = resultHourlyRate.textContent;
        const premiumRateStr = resultPremiumRate.textContent;
        const dailyRateStr = resultDailyRate.textContent;
        const grossYearlyStr = detailGrossYearly.textContent;
        const billableHoursStr = detailBillableHours.textContent;

        const markdownReport = `### 📊 NOWrate - Resumen de Tarifa Freelance
*Calculado con precisión para el estilo de marca NOWeb*

- **Tarifa Mínima Recomendada**: ${currentCurrencySymbol}${hourlyRateStr} / hora
- **Tarifa Premium Sugerida (+20%)**: ${premiumRateStr}
- **Tarifa Diaria Estimada (${hoursPerDay.toFixed(1)}h)**: ${dailyRateStr}

---
#### ⚙️ Parámetros de Cálculo:
- **Ingreso Neto Deseado**: ${currentCurrencySymbol}${netMonthly.toLocaleString(locale)}/mes
- **Gastos Operativos Fijos**: ${currentCurrencySymbol}${expensesMonthly.toLocaleString(locale)}/mes
  * Suscripciones:
${subsDetailsStr}  * Pago de Arriendo: ${currentCurrencySymbol}${expRent.toLocaleString(locale)}
  * Luz e Internet: ${currentCurrencySymbol}${expUtilities.toLocaleString(locale)}
  * Hardware y Componentes: ${currentCurrencySymbol}${expHardware.toLocaleString(locale)}
  * Otros Gastos: ${currentCurrencySymbol}${expOthers.toLocaleString(locale)}
- **Carga Fiscal (Impuestos)**: ${taxRate}%
- **Vacaciones Anuales**: ${vacationWeeks} semanas (${workingWeeks} semanas reales de trabajo)
- **Horas de Trabajo**: ${weeklyHours} horas/semana
- **Eficiencia Laboral (Billable Rate)**: ${billableRate}% (El ${100 - billableRate}% restante para administración y prospección)

---
#### 📈 Metas y Facturación Anual:
- **Ingreso Bruto Anual Necesario**: ${grossYearlyStr}
- **Horas Facturables Reales al Año**: ${billableHoursStr}

*Reporte generado por NOWrate Freelance Calculator*`;

        navigator.clipboard.writeText(markdownReport).then(() => {
            // Show toast feedback
            toast.classList.add('show');
            btnCopyText.textContent = '¡Copiado!';
            btnCopy.classList.add('btn-success'); // Class to animate active transition if desired

            setTimeout(() => {
                toast.classList.remove('show');
                btnCopyText.textContent = 'Copiar Resumen';
                btnCopy.classList.remove('btn-success');
            }, 2000);
        }).catch(err => {
            console.error('No se pudo copiar el reporte: ', err);
        });
    });

    // Trigger page printing formatted by print stylesheet
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    /* ==========================================================================
       Initial Load Core
       ========================================================================== */
    // Rebuild default subscriptions list on start (defaults to CLP)
    rebuildSubscriptions('CLP');

    // Initial Calculation on setup
    calculate();
});
