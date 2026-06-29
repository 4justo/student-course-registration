const form = document.querySelector('#loginForm');
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');
const loginMessage = document.querySelector('#loginMessage');

const showMessage = (message, isError = true) => {
  loginMessage.textContent = message;
  loginMessage.style.color = isError ? '#dc2626' : '#047857';
};

const validateForm = (data) => {
  if (!data.registrationNumber.trim()) {
    showMessage('Registration number is required.');
    return false;
  }
  if (data.password.length < 8 || data.password.length > 64) {
    showMessage('Password must be 8 to 64 characters.');
    return false;
  }
  return true;
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  const payload = {
    registrationNumber: document.querySelector('#registrationNumber').value,
    password: passwordInput.value,
    rememberMe: document.querySelector('#rememberMe').checked,
  };

  if (!validateForm(payload)) {
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json();
      showMessage(result?.error?.message || 'Login failed.');
      return;
    }

    showMessage('Login successful. Redirecting...', false);
    window.location.href = '/dashboard';
  } catch (error) {
    showMessage('Network error. Please try again.');
  }
});

togglePassword?.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
});
