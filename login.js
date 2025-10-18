// DOM Elements
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('error-msg');
const submitButton = loginForm.querySelector('button[type="submit"]');

// Function to show error message with animation
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
  setTimeout(() => {
    errorMsg.classList.add('visible');
  }, 10);
}

// Function to hide error message with animation
function hideError() {
  errorMsg.classList.remove('visible');
  setTimeout(() => {
    errorMsg.classList.add('hidden');
  }, 300);
}

// Function to set loading state
function setLoading(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging in...';
  } else {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Login';
  }
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();

  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }

  try {
    setLoading(true);
    
    // First try admin login
    const adminSnapshot = await db.collection('admins')
      .where('username', '==', username)
      .where('password', '==', password)
      .get();

    if (!adminSnapshot.empty) {
      // Admin login successful
      localStorage.setItem('smartlock_auth', 'true');
      localStorage.setItem('smartlock_user', username);
      localStorage.setItem('smartlock_role', 'admin');
      
      if (loginForm.querySelector('input[type="checkbox"]').checked) {
        localStorage.setItem('smartlock_remember', 'true');
      }

      submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>Success!';
      submitButton.classList.add('bg-green-600');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
      return;
    }

    // Try user login
    const userSnapshot = await db.collection('users')
      .where('username', '==', username)
      .where('password', '==', password)
      .get();

    if (!userSnapshot.empty) {
      // User login successful
      localStorage.setItem('smartlock_auth', 'true');
      localStorage.setItem('smartlock_user', username);
      localStorage.setItem('smartlock_role', 'user');
      
      if (loginForm.querySelector('input[type="checkbox"]').checked) {
        localStorage.setItem('smartlock_remember', 'true');
      }

      submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>Success!';
      submitButton.classList.add('bg-green-600');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
      return;
    }

    showError('Invalid username or password');
    setLoading(false);
  } catch (error) {
    console.error('Error during login:', error);
    showError('An error occurred. Please try again later.');
    setLoading(false);
  }
});

// Check for remembered user
window.addEventListener('DOMContentLoaded', () => {
  const rememberedUser = localStorage.getItem('smartlock_remember') && localStorage.getItem('smartlock_user');
  if (rememberedUser) {
    loginForm.username.value = localStorage.getItem('smartlock_user');
    loginForm.querySelector('input[type="checkbox"]').checked = true;
  }
});

// Clear error when user starts typing
loginForm.username.addEventListener('input', hideError);
loginForm.password.addEventListener('input', hideError);

// Clear any existing auth state
localStorage.removeItem('smartlock_auth');
localStorage.removeItem('smartlock_role');
if (!localStorage.getItem('smartlock_remember')) {
  localStorage.removeItem('smartlock_user');
}
