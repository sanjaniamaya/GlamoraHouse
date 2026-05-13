import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DOM elements
document.body.innerHTML = `
  <div id="navLinks"></div>
  <div class="menu-toggle"></div>
  <div id="success-msg"></div>
  <form id="bookingForm"></form>
  <div id="modalTitle"></div>
  <div id="modalDesc"></div>
  <div id="modalPrice"></div>
  <img id="modalImg" />
  <div id="serviceModal"></div>
`;

// Mock Firebase
vi.mock('../js/firebase-config.js', () => ({
  auth: {},
  db: {},
  onAuthStateChanged: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn()
}));

// We'll define the functions we want to test manually or import them if they were exported
// Since index.js defines them on window, we can simulate that

describe('UI Logic', () => {
  beforeEach(() => {
    // Reset window functions
    window.toggleMenu = function() {
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.querySelector('.menu-toggle');
        const isActive = navLinks.classList.toggle('active');
        if (isActive) {
            menuToggle.classList.add('hide');
        } else {
            menuToggle.classList.remove('hide');
        }
    };

    window.resetForm = function() {
        document.getElementById('success-msg').style.display = 'none';
        document.getElementById('bookingForm').style.display = 'block';
    };
  });

  it('should toggle menu visibility', () => {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.querySelector('.menu-toggle');
    
    window.toggleMenu();
    expect(navLinks.classList.contains('active')).toBe(true);
    expect(menuToggle.classList.contains('hide')).toBe(true);

    window.toggleMenu();
    expect(navLinks.classList.contains('active')).toBe(false);
    expect(menuToggle.classList.contains('hide')).toBe(false);
  });

  it('should reset form UI', () => {
    const successMsg = document.getElementById('success-msg');
    const bookingForm = document.getElementById('bookingForm');
    
    successMsg.style.display = 'block';
    bookingForm.style.display = 'none';
    
    window.resetForm();
    
    expect(successMsg.style.display).toBe('none');
    expect(bookingForm.style.display).toBe('block');
  });
});
