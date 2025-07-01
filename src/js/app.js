function getQueryString(name) {
    var url = window.location.href;
    var regex = new RegExp('[?&]' + name + '=([^&#]*)', 'i');
    var result = regex.exec(url);
    return result ? decodeURIComponent(result[1]) : null; // Return null if parameter is not found
}

// Get MacId from the URL
var macId = '03';
var queryMacId = getQueryString('MacId');
if (queryMacId) {
    macId = queryMacId;
}
if (!macId) {
    console.error('MacId is missing in the URL');
}

// Convert macId to number for comparison
var macIdNum = parseInt(macId, 10);
if (isNaN(macIdNum)) {
    console.error('Invalid MacId format');
    macIdNum = 0;
}

// Show/hide Today Target column based on macId
function toggleTodayTargetColumn() {
    var targetColumn = document.querySelector('.today-target-column');
    var targetCells = document.querySelectorAll('.today-target-cell');
    var table = document.querySelector('.single-header-table');
    //console.log(macIdNum);
    if (macIdNum < 24) {
        if (targetColumn) {
            //console.log('targetColumn', targetColumn);
            targetColumn.style.display = 'table-cell';
        }
        targetCells.forEach(function(cell) {
            cell.style.display = 'table-cell';
        });
        if(table){
            table.classList.add('show-target-column');
        }
    } else {
        if (targetColumn) {
            targetColumn.style.display = 'none';
        }
        targetCells.forEach(function(cell) {
            cell.style.display = 'none';
        });
        if(table){
            table.classList.remove('show-target-column');
        }
    }
}

document.getElementById('lineTitle').textContent = 'Line ' + macId;

// Add current time display
function updateClock() {
    //var timeString = new Date().toLocaleTimeString();
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    
    // Add leading zeros
    hours = hours-1 < 10 ? '0' + hours-1 : hours-1;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    
    var timeString = hours + ':' + minutes + ':' + seconds;
    var clockElement = document.getElementById('currentTime');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

// Update the clock every second
updateClock();
setInterval(updateClock, 1000);

var apiUrl = 'http://192.168.170.24/AktTVAPI/api/TV/GetDailyProduction?MacId=' + macId;
// Function to fetch data from the API
function fetchData() {
    var xhr = new XMLHttpRequest();
   

    xhr.open('GET', apiUrl, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            if (response.code === 200) {
                updateUI(response.data);
            } else {
                console.error('Error fetching data:', response.message);
            }
        }
    };

    xhr.onerror = function () {
        console.error('Network error while fetching data.');
    };

    xhr.send();
}

// Function to update the UI with fetched data
function updateUI(data) {
    var productionSummaries = data.productionSummaries;
    var productionDailies = data.productionDailies;

    // Update Hourly Production Table
    updateHourlyProduction(productionDailies);
    
    // Update Current Production Status
    updateProductionStatus(productionSummaries);

    
}

function updateProductionStatus(productionSummaries) {
    var tbody = document.getElementById('currentStatusBody');
    if (!tbody) {
        console.error('Current status table body not found');
        return;
    }

    // 使用文档片段存储新行，减少DOM操作
    var fragment = document.createDocumentFragment();
    
    // 清理现有行
    while (tbody.firstChild) {
        tbody.firstChild.remove();
    }

    // 遍历数据创建新行
    for (var i = 0; i < productionSummaries.length; i++) {
        var summary = productionSummaries[i];
        var row = document.createElement('tr');
        
        // Determine progress bar color based on percentage
        var progressColor = summary.pct >= 80 ? '#4caf50' : '#ff5555';

        // Add status class based on colorStatus
        if (summary.colorStatus === 2&&summary.cutQty!==summary.totalProcess5) {
            row.className = 'status-emergency';
        } else if (summary.colorStatus === 1&&summary.cutQty!==summary.totalProcess5) {
            row.className = 'status-warning';
        } else {
            row.className = 'status-normal';
        }

        row.innerHTML = 
            '<td>' + summary.jobNo + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(summary.orderQty) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(summary.cutQty) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(summary.totalProcess3) + '</td>' +
            '<td class="today-target-cell">' + formatNumberWithThousandSeparator(summary.todayTarget) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(summary.todayProcess5) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(summary.totalProcess5) + '</td>' +
            '<td><div class="progress-container">' +
            '<div class="progress-bar" style="width: ' + summary.pct + '%; background-color: ' + progressColor + '"></div>' +
            '<span>' + summary.pct + '%</span>' +
            '</div></td>';

        fragment.appendChild(row);
    }

    // 一次性更新DOM
    tbody.appendChild(fragment);
    
    // Update Today Target column visibility
    toggleTodayTargetColumn();
}

function updateHourlyProduction(productionDailies) {
    var tableBody = document.getElementById('hourlyProductionBody');
    if (!tableBody) {
        console.error('Hourly production table body not found');
        return;
    }

    var fragment = document.createDocumentFragment();

    // 清理现有行
    while (tableBody.firstChild) {
        tableBody.firstChild.remove();
    }

    // 创建日期格式化函数
    function formatDate(date) {
        var d = new Date(date);
        return (d.getMonth() + 1) + '-' + d.getDate();// + '-' + d.getFullYear();
    }

    // 遍历数据创建新行
    for (var i = 0; i < productionDailies.length; i++) {
        var daily = productionDailies[i];
        var row = document.createElement('tr');
        
        row.innerHTML = 
            '<td>' + formatDate(daily.productDate) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time1) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time2) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time3) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time4) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time5) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time6) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time7) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time8) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time9) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.time10) + '</td>' +
            '<td>' + formatNumberWithThousandSeparator(daily.totalQty) + '</td>';

        fragment.appendChild(row);
    }

    // 一次性更新DOM
    tableBody.appendChild(fragment);
}

// Fetch data every minute
fetchData();
setInterval(fetchData, 60000);

/**
 * 将数字格式化为千分位显示
 * 兼容Android 5.1.1 Chrome 39.0.0.0等旧版浏览器
 * @param {number|string} num - 要格式化的数字或数字字符串
 * @param {string} separator - 千分位分隔符，默认为逗号
 * @return {string} 格式化后的字符串
 */
function formatNumberWithThousandSeparator(num, separator) {
    // 如果输入为null、undefined或空字符串，直接返回空字符串
    if (num === null || num === undefined || num === '') {
        return '';
    }
    
    // 如果不是数字，尝试转换为数字，如果转换失败则返回原值
    var numValue = Number(num);
    if (isNaN(numValue)) {
        return String(num);
    }
    
    // 设置默认分隔符为逗号
    separator = separator || ',';
    
    // 确保输入是字符串
    var numStr = String(num);
    
    // 处理可能的负数
    var sign = '';
    if (numStr.charAt(0) === '-') {
        sign = '-';
        numStr = numStr.substring(1);
    }
    
    // 分离整数部分和小数部分
    var parts = numStr.split('.');
    var integerPart = parts[0];
    var decimalPart = parts.length > 1 ? '.' + parts[1] : '';
    
    // 从右到左每3位添加分隔符
    var result = '';
    var len = integerPart.length;
    
    for (var i = 0; i < len; i++) {
        // 当不是第一位且位置是3的倍数时添加分隔符
        if (i > 0 && (len - i) % 3 === 0) {
            result += separator;
        }
        result += integerPart.charAt(i);
    }
    
    // 返回带符号的结果
    return sign + result + decimalPart;
}