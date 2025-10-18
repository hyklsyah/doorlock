// DOM Elements
const logsList = document.getElementById('logs-list');
const searchInput = document.getElementById('search-input');
const filterMethod = document.getElementById('filter-method');
const filterStatus = document.getElementById('filter-status');
const filterDate = document.getElementById('filter-date');
const loadMoreBtn = document.getElementById('load-more-btn');

// State management
let logs = [];
let lastDoc = null;
const LOGS_PER_PAGE = 20;

// Utility functions
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString();
}

function getStatusBadge(status) {
  switch (status) {
    case 'success':
      return '<span class="px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm">Success</span>';
    case 'failed':
      return '<span class="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">Failed</span>';
    case 'threat':
      return '<span class="px-2 py-1 rounded-full bg-red-100 text-red-800 text-sm">Threat</span>';
    default:
      return '<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">Unknown</span>';
  }
}

function getMethodIcon(method) {
  switch (method) {
    case 'website':
      return '<i class="fas fa-globe text-blue-500"></i>';
    case 'fingerprint':
      return '<i class="fas fa-fingerprint text-green-500"></i>';
    case 'pin-only':
      return '<i class="fas fa-exclamation-triangle text-red-500"></i>';
    default:
      return '<i class="fas fa-question-circle text-gray-500"></i>';
  }
}

function getMethodText(method) {
  switch (method) {
    case 'website':
      return 'Web Access';
    case 'fingerprint':
      return 'Fingerprint & PIN';
    case 'pin-only':
      return 'PIN Only (Threat)';
    default:
      return 'Unknown';
  }
}

// Create log row element
function createLogRow(log) {
  const tr = document.createElement('tr');
  tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200';
  
  tr.innerHTML = `
    <td class="px-4 py-3 text-gray-600 whitespace-nowrap">
      ${formatTimestamp(log.timestamp)}
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
          <i class="fas fa-user text-gray-500"></i>
        </div>
        <span class="font-medium text-gray-800">${log.username || 'Unknown'}</span>
      </div>
    </td>
    <td class="px-4 py-3">
      <div class="flex items-center">
        ${getMethodIcon(log.method)}
        <span class="ml-2 text-gray-600">${getMethodText(log.method)}</span>
      </div>
    </td>
    <td class="px-4 py-3 text-gray-600">
      ${log.details || 'No additional details'}
    </td>
    <td class="px-4 py-3">
      ${getStatusBadge(log.status)}
    </td>
  `;
  return tr;
}

// Filter functions
function filterByDate(logs, dateFilter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return logs.filter(log => {
    const logDate = new Date(log.timestamp?.seconds * 1000);
    switch (dateFilter) {
      case 'today':
        return logDate >= today;
      case 'week':
        return logDate >= weekAgo;;
      default:
        return true;
    }
  });
}

function filterByMethod(logs, methodFilter) {
  if (methodFilter === 'all') return logs;
  return logs.filter(log => log.method === methodFilter);
}

function filterByStatus(logs, statusFilter) {
  if (statusFilter === 'all') return logs;
  return logs.filter(log => log.status === statusFilter);
}

function filterBySearch(logs, searchTerm) {
  if (!searchTerm) return logs;
  searchTerm = searchTerm.toLowerCase();
  return logs.filter(log => 
    log.username?.toLowerCase().includes(searchTerm) ||
    log.details?.toLowerCase().includes(searchTerm)
  );
}

// Render functions
function renderLogs(filteredLogs = logs) {
  logsList.innerHTML = '';
  
  if (filteredLogs.length === 0) {
    logsList.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-gray-500">
          <i class="fas fa-history text-3xl mb-4"></i>
          <p>No activity logs found</p>
        </td>
      </tr>
    `;
    loadMoreBtn.style.display = 'none';
    return;
  }

  filteredLogs.forEach(log => {
    logsList.appendChild(createLogRow(log));
  });
}

async function fetchLogs(isInitial = false) {
  try {
    if (isInitial) {
      logs = [];
      lastDoc = null;
      logsList.innerHTML = '<tr><td colspan="5" class="text-center py-8">Loading...</td></tr>';
    }


    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(new Date().getDate() - 30);

 
    let query = db.collection('access_logs')
      .where('timestamp', '>=', fourteenDaysAgo)
      .orderBy('timestamp', 'desc');


    if (!isInitial && lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    query = query.limit(LOGS_PER_PAGE);

    const snapshot = await query.get();
    const newLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (isInitial) {
      logs = newLogs;
      logsList.innerHTML = '';
    } else {
      logs = [...logs, ...newLogs];
    }
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    loadMoreBtn.style.display = newLogs.length < LOGS_PER_PAGE ? 'none' : 'inline-flex';

    applyFilters();
  } catch (error) {
    console.error('Error fetching logs:', error);
    logsList.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500"><p>Error loading logs.</p></td></tr>`;
  }
}

// Apply all filters
function applyFilters() {
  let filteredLogs = [...logs];
  
  // Apply method filter
  filteredLogs = filterByMethod(filteredLogs, filterMethod.value);
  
  // Apply status filter
  filteredLogs = filterByStatus(filteredLogs, filterStatus.value);
  
  // Apply date filter
  filteredLogs = filterByDate(filteredLogs, filterDate.value);
  
  // Apply search filter
  filteredLogs = filterBySearch(filteredLogs, searchInput.value);
  
  renderLogs(filteredLogs);
}

// Event listeners
searchInput.addEventListener('input', applyFilters);
filterMethod.addEventListener('change', applyFilters);
filterStatus.addEventListener('change', applyFilters);
filterDate.addEventListener('change', applyFilters);
loadMoreBtn.addEventListener('click', () => fetchLogs(false));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchLogs(true);
});

// Set up real-time updates
db.collection('access_logs')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const newLog = { id: change.doc.id, ...change.doc.data() };
        // Only add if it's actually new
        if (!logs.some(log => log.id === newLog.id)) {
          logs.unshift(newLog);
          applyFilters();
        }
      }
    });
  }, (error) => {
    console.error('Error listening to logs collection:', error);
  });
