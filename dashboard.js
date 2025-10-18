
const doorStatusDisplay = document.getElementById('door-status');
const doorControlBtn = document.getElementById('door-control-btn');
const doorStatusText = document.getElementById('door-status-text');
const usersList = document.getElementById('users-list');
const logsList = document.getElementById('logs-list');
const lastUpdated = document.getElementById('last-updated');
const activeUsersDisplay = document.getElementById('active-users');


const modalBackdrop = document.getElementById('editPasswordModalBackdrop');
const saveButton = document.getElementById('savePasswordBtn');
const cancelButton = document.getElementById('cancelBtn');
const newPasswordInput = document.getElementById('newPassword');

// Elemen Modal Delete
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');

let userToDelete = null;

const isAdmin = localStorage.getItem('smartlock_role') === 'admin';


function updateLastUpdated() {
  if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString('id-ID');
}

function formatTimestamp(timestamp) {
  if (!timestamp || !timestamp.seconds) return 'Unknown time';
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString('id-ID');
}

function showNotification(message, type = 'success') {
  alert(message); // Menggunakan alert sederhana untuk sementara
}


async function updateDoorStatus() {
  try {
    const doc = await db.collection('door_status').doc('current').get();
    const status = doc.data()?.status || 'Unknown';
    
    // Update teks status utama jika elemennya ada
    if (doorStatusDisplay) {
        doorStatusDisplay.innerHTML = `<span class="font-medium">${status}</span>`;
    }
    
    // Periksa apakah elemen tombol dan teks status ada sebelum mengubahnya
    if (doorControlBtn && doorStatusText) {
      if (status.toLowerCase() === 'terbuka') {
        doorControlBtn.innerHTML = '<i class="fas fa-door-closed mr-2"></i>Tutup Pintu';
        doorStatusText.textContent = 'Pintu Terbuka';
        doorControlBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        doorControlBtn.classList.add('bg-red-600', 'hover:bg-red-700');
      } else {
        doorControlBtn.innerHTML = '<i class="fas fa-door-open mr-2"></i>Buka Pintu';
        doorStatusText.textContent = 'Pintu Terkunci';
        doorControlBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        doorControlBtn.classList.add('bg-green-600', 'hover:bg-green-700');
      }
    }

  } catch (error) {
    console.error('Error fetching door status:', error);
    if (doorStatusDisplay) doorStatusDisplay.textContent = 'Error checking status';
  }
}

async function toggleDoor() {

  console.log("Fungsi toggleDoor() berhasil dipanggil!");

  const currentStatus = doorStatusText.textContent.toLowerCase();
  const user = localStorage.getItem('smartlock_user') || 'Unknown User';
  const action = currentStatus.includes('terbuka') ? 'close' : 'open';


  console.log(`Status saat ini: '${currentStatus}'. Aksi yang akan dikirim: '${action}'.`);

  try {

    console.log("Mengirim perintah ke Firestore...");

    await db.collection('door_commands').doc('command').set({
      action: action,
      timestamp: new Date(),
      user: user
    });


    console.log("BERHASIL: Perintah berhasil dikirim ke Firestore.");
    showNotification(`Command '${action}' sent successfully!`);
    
  } catch (error) {

    console.error("GAGAL: Terjadi error saat mengirim perintah:", error);
    showNotification('Failed to send command', 'error');
  }
}


async function renderUsers() {
  if (!usersList) return;
  try {
    const snapshot = await db.collection('admins').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    usersList.innerHTML = users.map(user => `
      <li class="flex items-center justify-between py-2 border-b border-gray-200">
        <div class="flex items-center">
          <i class="fas fa-user text-blue-500 mr-3"></i>
          <span>${user.username}</span>
        </div>
        <div class="flex space-x-4">
          <button 
            class="edit-password-btn text-yellow-500 hover:text-yellow-700 transition-colors"
            data-user-id="${user.id}"
            title="Edit Password">
            <i class="fas fa-edit"></i>
          </button>
          <button 
            class="delete-user-btn text-red-500 hover:text-red-700 transition-colors" 
            data-user-id="${user.id}" 
            data-user-name="${user.username}"
            title="Delete User">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </li>
    `).join('');
    
    if (activeUsersDisplay) activeUsersDisplay.textContent = `${users.length} Active`;
  } catch (error) {
    console.error('Error fetching users:', error);
    usersList.innerHTML = '<li class="text-red-500">Error loading users</li>';
  }
}

// Tambahkan fungsi baru ini
async function calculateTodaysAccess() {
  const todayAccessDisplay = document.getElementById('today-access');
  if (!todayAccessDisplay) return;

  try {
    // Tentukan waktu mulai hari ini (pukul 00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buat query untuk mengambil log dari hari ini
    const snapshot = await db.collection('access_logs')
      .where('timestamp', '>=', today)
      .get();

    // Update tampilan dengan jumlah log yang ditemukan
    todayAccessDisplay.textContent = `${snapshot.size} Times`;

  } catch (error) {
    console.error("Error calculating today's access:", error);
    todayAccessDisplay.textContent = 'Error';
  }
}


function editPassword(userId) {
  if (modalBackdrop) {
    modalBackdrop.dataset.userId = userId;
    modalBackdrop.style.display = 'flex';
  }
}

function closeModal() {
  if (modalBackdrop) {
    modalBackdrop.style.display = 'none';
    if (newPasswordInput) newPasswordInput.value = '';
    delete modalBackdrop.dataset.userId;
  }
}

function showDeleteModal(userId) {
  userToDelete = userId;
  if (deleteModal) deleteModal.style.display = 'flex';
}

function hideDeleteModal() {
  userToDelete = null;
  if (deleteModal) deleteModal.style.display = 'none';
}

function confirmDeleteUser(userId, username) {
  // Fungsi konfirmasi sederhana sebelum memanggil showDeleteModal
  if (confirm(`Are you sure you want to delete user: ${username}?`)) {
    showDeleteModal(userId); // Tampilkan modal kustom jika konfirmasi 'OK'
  }
}

async function deleteUser(userId) {
  try {
    await db.collection('admins').doc(userId).delete();
    showNotification('User deleted successfully');
    hideDeleteModal();
    // onSnapshot akan memuat ulang data secara otomatis.
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user', 'error');
  }
}

// 1. Listener untuk elemen statis (selalu ada di halaman)
if (doorControlBtn) {
    doorControlBtn.addEventListener('click', toggleDoor);
}

if (saveButton) {
  saveButton.addEventListener('click', async () => {
    if (!modalBackdrop) return;
    const userId = modalBackdrop.dataset.userId;
    const newPassword = newPasswordInput.value.trim();

    if (!userId) return showNotification('Error: User ID is missing.', 'error');
    if (newPassword.length < 6) return showNotification('Password must be at least 6 characters.', 'error');

    try {
      await db.collection('admins').doc(userId).update({ password: newPassword });
      showNotification('Password updated successfully');
      closeModal();
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Failed to update password.', 'error');
    }
  });
}

if (cancelButton) cancelButton.addEventListener('click', closeModal);

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    if (userToDelete) {
      deleteUser(userToDelete);
    }
  });
}

if (usersList) {
  usersList.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;

    const userId = target.dataset.userId;
    
    if (target.classList.contains('edit-password-btn')) {
      editPassword(userId);
    }
    
    if (target.classList.contains('delete-user-btn')) {
      showDeleteModal(userId); 
    }
  });
}

// 3. Inisialisasi halaman
document.addEventListener('DOMContentLoaded', () => {
  updateDoorStatus();
  updateLastUpdated();
  setInterval(updateLastUpdated, 60000);

  if (isAdmin) {
    renderUsers();
    calculateTodaysAccess();

    
    // Listener real-time untuk admin
    db.collection('admins').onSnapshot(renderUsers);
    calculateTodaysAccess();
  }

  // Listener real-time untuk status pintu
  db.collection('door_status').doc('current').onSnapshot(updateDoorStatus);
});