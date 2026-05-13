import { test, expect } from '@playwright/test';

test.describe('Glamora House - Comprehensive Feature Tests', () => {

  test('Authentication: Login & Signup pages are accessible', async ({ page }) => {
    // Test Login Page
    await page.goto('/html/login.html');
    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator('.auth-form')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-pass')).toBeVisible();

    // Test Signup Page
    await page.goto('/html/signup.html');
    await expect(page).toHaveTitle(/Sign Up/);
    await expect(page.locator('.auth-form')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  // Helper to "login" as admin by setting session storage
  async function adminLogin(page) {
    await page.goto('/html/login.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      sessionStorage.setItem("adminLoggedIn", "true");
    });
  }

  test('Booking: Appointment form on homepage is functional', async ({ page }) => {
    await page.goto('/html/index.html');
    
    // Scroll to contact/booking section
    const bookingForm = page.locator('#bookingForm');
    await bookingForm.scrollIntoViewIfNeeded();
    await expect(bookingForm).toBeVisible();

    // Check form fields
    await expect(page.locator('#c_name')).toBeVisible();
    await expect(page.locator('#c_phone')).toBeVisible();
    await expect(page.locator('#c_date')).toBeVisible();
    await expect(page.locator('#c_time')).toBeVisible();
    await expect(page.locator('#c_service')).toBeVisible();
  });

  test('Admin Panel: Dashboard and Management sections are present', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/html/admin.html');
    
    // Check Sidebar links
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Users")')).toBeVisible();
    await expect(page.locator('a:has-text("Staff Management")')).toBeVisible();
    await expect(page.locator('a:has-text("Services Management")')).toBeVisible();
    await expect(page.locator('a:has-text("Appointments")')).toBeVisible();
    await expect(page.locator('a:has-text("Feedbacks")')).toBeVisible();

    // Check if sections exist (even if hidden initially)
    await expect(page.locator('#s-dashboard')).toBeAttached();
    await expect(page.locator('#s-users')).toBeAttached();
    await expect(page.locator('#s-staff')).toBeAttached();
    await expect(page.locator('#s-services')).toBeAttached();
  });

  test('Admin Panel: Add Staff & Add Service modals', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/html/admin.html');

    // Switch to Staff Section
    await page.locator('a:has-text("Staff Management")').click();
    await expect(page.locator('#s-staff')).toBeVisible();

    // Test Staff Modal trigger
    const addStaffBtn = page.locator('button:has-text("Add Staff")');
    await addStaffBtn.click();
    await expect(page.locator('#staffModal')).toBeVisible();
    await expect(page.locator('#staffName')).toBeVisible();
    await page.locator('#staffModal .btn-close-white').first().click(); // Close modal

    // Switch to Services Section
    await page.locator('a:has-text("Services Management")').click();
    await expect(page.locator('#s-services')).toBeVisible();

    // Test Service Modal trigger
    const addServiceBtn = page.locator('button:has-text("Add Service")');
    await addServiceBtn.click();
    await expect(page.locator('#serviceModal')).toBeVisible();
    await expect(page.locator('#serviceTitle')).toBeVisible();
  });

  test('Navigation: Nav links lead to correct pages', async ({ page }) => {
    await page.goto('/html/index.html');
    // Fix strict mode violation by being specific
    const aboutLink = page.locator('nav a:has-text("About")').first();
    await expect(aboutLink).toBeVisible();
    
    const servicesLink = page.locator('nav .nav-links a:has-text("Services")').first();
    await servicesLink.click();
    await expect(page).toHaveURL(/services.html/);
    
    await page.goto('/html/index.html');
    const galleryLink = page.locator('nav .nav-links a:has-text("Gallery")').first();
    await galleryLink.click();
    await expect(page).toHaveURL(/gallery.html/);
  });

});
