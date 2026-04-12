const defaultAvatar = './src/img/default_avatar_5.png';

async function resolveAvatarSource(value) {
  if (!value) return defaultAvatar;
  if (window.MediaStore) {
    const resolved = await window.MediaStore.resolveMediaReference(value);
    return resolved || defaultAvatar;
  }
  return value;
}

async function persistAvatar(value) {
  const normalized = window.MediaStore
    ? await window.MediaStore.prepareMediaReference(value)
    : value;
  localStorage.setItem('pmag_avatar', normalized || '');
  if (typeof window.requestMediaCleanup === "function") {
    window.requestMediaCleanup();
  }
  return normalized;
}

async function openProfileModal() {
  const avatar = localStorage.getItem('pmag_avatar');
  const avatarPreview = document.getElementById('avatarPreview');
  avatarPreview.src = await resolveAvatarSource(avatar);
  // Remove highlight from all choices
  document.querySelectorAll('.avatar-choice').forEach(img => img.classList.remove('selected'));
  // Highlight the selected avatar if one of the defaults is chosen
  document.querySelectorAll('.avatar-choice').forEach(img => {
    if (avatar === img.dataset.avatar) img.classList.add('selected');
  });

}

async function showProfileModal() {
  const modal = document.getElementById('profileModal');
  const nicknameInput = document.getElementById('nicknameInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarInput = document.getElementById('avatarInput');

  // Load current values
  nicknameInput.value = localStorage.getItem('pmag_nickname') || '';
  avatarPreview.src = await resolveAvatarSource(localStorage.getItem('pmag_avatar'));

  modal.classList.remove('d-none');
  nicknameInput.focus();

  // Avatar preview
  avatarInput.onchange = function() {
    const file = avatarInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => avatarPreview.src = e.target.result;
      reader.readAsDataURL(file);
    }
  };
}

// Save profile
document.getElementById('saveProfileBtn').onclick = async function() {
  const nickname = document.getElementById('nicknameInput').value.trim();
  const avatarSrc = document.getElementById('avatarPreview').src;
  if (nickname.length > 0) {
    localStorage.setItem('pmag_nickname', nickname);
    if (avatarSrc && avatarSrc !== defaultAvatar) {
      await persistAvatar(avatarSrc);
    }
    await updateProfileDisplay();
    document.getElementById('profileModal').classList.add('d-none');
  } else {
    document.getElementById('nicknameInput').classList.add('is-invalid');
  }
};

// Close modal
document.getElementById('closeProfileModal').onclick = function() {
  document.getElementById('profileModal').classList.add('d-none');
};

// Edit button
document.getElementById('editProfileBtn').onclick = showProfileModal;

// Show profile display if set
async function updateProfileDisplay() {
  const nickname = localStorage.getItem('pmag_nickname');
  const avatar = localStorage.getItem('pmag_avatar');
  const display = document.getElementById('profileDisplay');
  const nickSpan = document.getElementById('profileNickname');
  const avatarImg = document.getElementById('profileAvatar');
  if (nickname) {
    display.classList.remove('d-none');
    nickSpan.textContent = nickname;
    avatarImg.src = await resolveAvatarSource(avatar);
  } else {
    display.classList.add('d-none');
  }
}

const avatarChoices = document.querySelectorAll('.avatar-choice');
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

// Handle default avatar selection
avatarChoices.forEach(img => {
  img.addEventListener('click', async () => {
    avatarChoices.forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    avatarPreview.src = img.dataset.avatar;
    await persistAvatar(img.dataset.avatar);
  });
});

// Handle custom upload
avatarInput.addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    avatarPreview.src = e.target.result;
    avatarChoices.forEach(i => i.classList.remove('selected'));
    await persistAvatar(e.target.result);
  };
  reader.readAsDataURL(file);
});

// Show modal on first load if not set
document.addEventListener('DOMContentLoaded', function() {
  updateProfileDisplay();
  if (!localStorage.getItem('pmag_nickname')) {
    setTimeout(showProfileModal, 500);
  }
});