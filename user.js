
const webUserForm = document.getElementById('web-user-form');
const fingerprintUserForm = document.getElementById('fingerprint-user-form');
const usersList = document.getElementById('users-list');
const searchInput = document.getElementById('search-users');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const notification = document.getElementById('notification');
const editModal = document.getElementById('edit-user-modal');
const editUserForm = document.getElementById('edit-user-form');
const confirmEditBtn = document.getElementById('confirm-edit');
const cancelEditBtn = document.getElementById('cancel-edit');


let users = [];
let userToDelete = null;


function showNotification(message, type = 'success') {
  const notif = notification.querySelector('div');
  const icon = notification.querySelector('i');
  const text = notification.querySelector('p');

  if (type === 'success') {
    notif.className = 'max-w-lg mx-auto m-4 p-4 rounded-lg shadow-lg flex items-center justify-between bg-green-100';
    icon.className = 'fas fa-check-circle mr-3 text-xl text-green-500';
    text.className = 'font-medium text-green-800';
  } else {
    notif.className = 'max-w-lg mx-auto m-4 p-4 rounded-lg shadow-lg flex items-center justify-between bg-red-100';
    icon.className = 'fas fa-exclamation-circle mr-3 text-xl text-red-500';
    text.className = 'font-medium text-red-800';
  }

  text.textContent = message;
  notification.classList.add('show');

  setTimeout(hideNotification, 3000);
}

function hideNotification() {
  notification.classList.remove('show');
}

function showDeleteModal(userId) {
  userToDelete = userId;
  deleteModal.style.display = 'flex';
}

function hideDeleteModal() {
  userToDelete = null;
  deleteModal.style.display = 'none';
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString();
}


// GANTI FUNGSI LAMA DENGAN INI
function createUserRow(user) {
  const tr = document.createElement('tr');
  tr.className = 'border-b border-gray-100 hover:bg-gray-50';
  
  const typeIcon = user.type === 'web' ? 'fa-globe' : 'fa-fingerprint';
  const typeColor = user.type === 'web' ? 'blue' : 'green';
  const accessDetails = user.type === 'web' 
    ? 'Web Access Only' 
    : `PIN: ${user.pin || 'Not Set'}`;
  
  tr.innerHTML = `
    <td class="px-4 py-3">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full bg-${typeColor}-100 flex items-center justify-center mr-3">
          <i class="fas ${typeIcon} text-${typeColor}-500"></i>
        </div>
        <span class="font-medium text-gray-800">${user.username}</span>
      </div>
    </td>
    <td class="px-4 py-3">
      <span class="px-2 py-1 rounded-full bg-${typeColor}-100 text-${typeColor}-800 text-sm">
        ${user.type === 'web' ? 'Web User' : 'Fingerprint User'}
      </span>
    </td>
    <td class="px-4 py-3 text-gray-600">${accessDetails}</td>
    <td class="px-4 py-3 text-gray-600">${formatDate(user.createdAt)}</td>
    <td class="px-4 py-3">
      <div class="flex items-center justify-end space-x-4">
        <button onclick="showEditModal('${user.id}')" class="text-blue-500 hover:text-blue-700" title="Edit User">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="showDeleteModal('${user.id}')" class="text-red-500 hover:text-red-700" title="Delete User">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  `;
  return tr;
}


function renderUsers(filteredUsers = users) {
  usersList.innerHTML = '';
  
  if (filteredUsers.length === 0) {
    usersList.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8 text-gray-500">
          <i class="fas fa-users text-3xl mb-4"></i>
          <p>No users found</p>
        </td>
      </tr>
    `;
    return;
  }

  filteredUsers.forEach(user => {
    usersList.appendChild(createUserRow(user));
  });
}


async function fetchUsers() {
  try {
    const webSnapshot = await db.collection('users').where('type', '==', 'web').get();
    const fpSnapshot = await db.collection('users').where('type', '==', 'fingerprint').get();
    
    users = [
      ...webSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...fpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
    renderUsers();
  } catch (error) {
    console.error('Error fetching users:', error);
    showNotification('Failed to load users', 'error');
  }
}


async function addWebUser(username, password) {
  try {
    // Menambahkan pengguna web ke koleksi admins tanpa pembatasan jumlah
    await db.collection('admins').add({
      username,
      password,
      type: 'web',
      createdAt: new Date()
    });

    showNotification('Web user added successfully');
    webUserForm.reset();
  } catch (error) {
    console.error('Error adding web user:', error);
    showNotification(error.message || 'Failed to add web user', 'error');
    throw error;
  }
}


async function addFingerprintUser(username, fingerprintId, pin) {
  try {
    const docId = String(fingerprintId);
    const userRef = db.collection('users').doc(docId);

    const docSnap = await userRef.get();
    
    if (docSnap.exists) { 
      throw new Error('This fingerprint ID is already registered.');
    }

    await userRef.set({
      username,
      pin,
      type: 'fingerprint',
      createdAt: new Date()
    });

    showNotification('Fingerprint user added successfully');
    fingerprintUserForm.reset();
  } catch (error) {
    console.error('Error adding fingerprint user:', error);
    showNotification(error.message || 'Failed to add fingerprint user', 'error');
    throw error;
  }
}


async function deleteUser(userId) {
  try {
    await db.collection('users').doc(userId).delete();
    users = users.filter(user => user.id !== userId);
    renderUsers();
    showNotification('User deleted successfully');
    hideDeleteModal();
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user', 'error');
  }
}

// --- FUNGSI BARU UNTUK MODAL EDIT ---

function showEditModal(userId) {
  const userToEdit = users.find(user => user.id === userId);
  if (!userToEdit) {
    console.error('User not found!');
    return;
  }

  // Simpan ID user di form untuk referensi saat menyimpan
  editUserForm.dataset.userId = userId;

  // Isi form dengan data yang ada
  const usernameInput = editUserForm.querySelector('#edit-username');
  const pinInput = editUserForm.querySelector('#edit-pin');
  const pinGroup = editUserForm.querySelector('#edit-pin-group');
  
  usernameInput.value = userToEdit.username;

  // Tampilkan atau sembunyikan input PIN berdasarkan tipe user
  if (userToEdit.type === 'fingerprint') {
    pinInput.value = userToEdit.pin || '';
    pinGroup.style.display = 'block';
  } else {
    pinGroup.style.display = 'none';
  }

  editModal.style.display = 'flex';
}

function hideEditModal() {
  editUserForm.reset();
  delete editUserForm.dataset.userId;
  editModal.style.display = 'none';
}


function searchUsers(query) {
  query = query.toLowerCase();
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(query) ||
    (user.type === 'fingerprint' && user.fingerprintId.toString().includes(query))
  );
  renderUsers(filteredUsers);
}


webUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = webUserForm['web-username'].value.trim();
  const password = webUserForm['web-password'].value.trim();
  const confirmPassword = webUserForm['web-confirm-password'].value.trim();

  if (!username || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    await addWebUser(username, password);
    fetchUsers();
  } catch (error) {
    
  }
});


fingerprintUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = fingerprintUserForm['fp-username'].value.trim();
  const fingerprintId = fingerprintUserForm['fingerprint-id'].value.trim();
  const pin = fingerprintUserForm['pin'].value.trim();

  if (!username || !fingerprintId || !pin) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (pin.length !== 4 || !/^\d+$/.test(pin)) {
    showNotification('PIN HARUS TERDIRI DARI 4 dIGIT!', 'error');
    return;
  }

  try {
    await addFingerprintUser(username, parseInt(fingerprintId), pin);
    fetchUsers();
  } catch (error) {
    
  }
});

searchInput.addEventListener('input', (e) => {
  searchUsers(e.target.value.trim());
});

confirmDeleteBtn.addEventListener('click', () => {
  if (userToDelete) {
    deleteUser(userToDelete);
  }
});

// --- EVENT LISTENER BARU UNTUK FORM EDIT ---

editUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = editUserForm.dataset.userId;
  const username = editUserForm['edit-username'].value.trim();
  const pin = editUserForm['edit-pin'].value.trim();
  
  if (!username) {
    return showNotification('Username cannot be empty', 'error');
  }

  const userToEdit = users.find(user => user.id === userId);
  const dataToUpdate = {
    username: username
  };

  // Jika user fingerprint, validasi dan tambahkan PIN ke data update
  if (userToEdit.type === 'fingerprint') {
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      return showNotification('PIN must be 4 digits', 'error');
    }
    dataToUpdate.pin = pin;
  }

  try {
    // Tentukan koleksi mana yang akan diupdate
    const collectionName = userToEdit.type === 'web' ? 'admins' : 'users';
    await db.collection(collectionName).doc(userId).update(dataToUpdate);
    
    showNotification('User updated successfully');
    hideEditModal();
    fetchUsers(); // Muat ulang daftar pengguna
  } catch (error) {
    console.error('Error updating user:', error);
    showNotification('Failed to update user', 'error');
  }
});

cancelEditBtn.addEventListener('click', hideEditModal);


document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
});


db.collection('users').onSnapshot(() => {
  fetchUsers();
}, (error) => {
  console.error('Error listening to users collection:', error);
  showNotification('Failed to sync user updates', 'error');
});
