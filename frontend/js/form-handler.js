/**
 * FORM HANDLER V2
 * Handles form submission with image compression and FormData binary upload
 */

class FormHandler {
    constructor(form, configLoader, themeManager) {
        this.form = form;
        this.config = configLoader;
        this.theme = themeManager;
        this.selectedOwner = null;
        this.selectedImage = null;
        this.selectedImageBase64 = null;
        this.appsScriptUrl = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Owner selection
        document.querySelectorAll('.owner-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectOwner(e));
        });

        // Type change - populate categories
        document.getElementById('typeSelect').addEventListener('change', (e) => {
            this.populateCategories(e.target.value);
        });

        // Amount validation
        document.getElementById('amountInput').addEventListener('input', (e) => {
            this.validateAmount(e.target.value);
        });

        // Image upload
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleImageSelect(e);
        });

        // Image drag and drop
        const uploadArea = document.getElementById('imageUploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                document.getElementById('imageInput').files = e.dataTransfer.files;
                this.handleImageSelect({ target: { files: e.dataTransfer.files } });
            }
        });

        // Click to open file dialog
        uploadArea.addEventListener('click', () => {
            document.getElementById('imageInput').click();
        });

        // Remove image button
        document.getElementById('removeImageBtn').addEventListener('click', () => {
            this.removeImage();
        });

        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Populate initial transaction types
        this.populateTypes();
    }

    setDefaultDate() {
        const dateInput = document.getElementById('dateInput');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    populateTypes() {
        const typeSelect = document.getElementById('typeSelect');
        const types = this.config.getTypes();
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.display;
            typeSelect.appendChild(option);
        });
    }

    populateCategories(typeValue) {
        const categorySelect = document.getElementById('categorySelect');
        categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        
        if (!typeValue) return;
        
        const categories = this.config.getCategoriesByType(typeValue);
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = category.display;
            categorySelect.appendChild(option);
        });
    }

    selectOwner(event) {
        const btn = event.currentTarget;
        const owner = btn.dataset.owner;

        // Remove active class from all buttons
        document.querySelectorAll('.owner-btn').forEach(b => {
            b.classList.remove('active');
        });

        // Add active class to clicked button
        btn.classList.add('active');
        this.selectedOwner = owner;
        document.getElementById('ownerInput').value = owner;

        // Auto-switch theme to match owner
        if (this.theme && this.theme.setThemeByOwner) {
            this.theme.setThemeByOwner(owner);
        }

        // Update stats UI
        this.updateStatsUI(owner);
    }

    updateStatsUI(owner) {
        if (window.app && window.app.stats && window.app.stats[owner]) {
            const stats = window.app.stats[owner];
            document.getElementById('statIncome').textContent = this.config.formatCurrency(stats.income || 0);
            document.getElementById('statExpense').textContent = this.config.formatCurrency(stats.expense || 0);
            document.getElementById('statInvestment').textContent = this.config.formatCurrency(stats.investment || 0);
            document.getElementById('quickStats').style.display = 'block';
        } else {
            document.getElementById('quickStats').style.display = 'none';
        }
    }

    validateAmount(value) {
        const amountInput = document.getElementById('amountInput');
        const amountHint = document.getElementById('amountHint');
        const validation = this.config.getValidation();
        const amount = parseFloat(value) || 0;

        let message = '';
        let isValid = true;

        if (amount < validation.min_amount) {
            message = `Minimal Rp ${this.config.formatCurrency(validation.min_amount)}`;
            isValid = false;
        } else if (amount > validation.max_amount) {
            message = `Maksimal Rp ${this.config.formatCurrency(validation.max_amount)}`;
            isValid = false;
        }

        amountHint.textContent = message;
        amountInput.style.borderColor = isValid ? '' : '#ef4444';
        
        return isValid;
    }

    async handleImageSelect(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        const file = files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB raw, will be compressed

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showFeedback('Hanya file gambar yang diizinkan', 'error');
            return;
        }

        if (file.size > maxSize) {
            this.showFeedback('Ukuran gambar tidak boleh lebih dari 10MB', 'error');
            return;
        }

        // Show compressing feedback
        const hint = document.getElementById('amountHint');
        hint.textContent = 'Mengompres gambar...';

        try {
            // Compress image using ImageUtils
            const compressedBase64 = await window.ImageUtils.compressToBase64(
                file,
                1200,  // max width
                1200,  // max height
                0.7    // quality
            );

            // Store compressed base64
            this.selectedImage = file;
            this.selectedImageBase64 = compressedBase64;

            // Show preview
            this.showImagePreview(file, compressedBase64);
            hint.textContent = '';
        } catch (error) {
            console.error('Image compression error:', error);
            this.showFeedback('Gagal mengompres gambar: ' + error.message, 'error');
            hint.textContent = '';
        }
    }

    showImagePreview(file, base64) {
        const preview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        previewImage.src = base64;
        preview.style.display = 'block';
        document.getElementById('imageUploadArea').style.display = 'none';
    }

    removeImage() {
        this.selectedImage = null;
        this.selectedImageBase64 = null;
        document.getElementById('imageInput').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('imageUploadArea').style.display = 'block';
    }

    validateForm() {
        const owner = document.getElementById('ownerInput').value;
        const date = document.getElementById('dateInput').value;
        const type = document.getElementById('typeSelect').value;
        const category = document.getElementById('categorySelect').value;
        const detail = document.getElementById('detailInput').value;
        const amount = document.getElementById('amountInput').value;

        const errors = [];

        if (!owner) errors.push('Pilih pemilik transaksi (Tama/Nana)');
        if (!date) errors.push('Tanggal harus diisi');
        if (!type) errors.push('Jenis transaksi harus dipilih');
        if (!category) errors.push('Kategori harus dipilih');
        if (!detail) errors.push('Detail transaksi harus diisi');
        if (!amount) errors.push('Nominal harus diisi');

        if (!this.validateAmount(amount)) {
            errors.push('Nominal tidak valid');
        }

        if (errors.length > 0) {
            this.showFeedback(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    async handleSubmit(event) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        // Show loading state
        this.setLoading(true);
        try {
            const owner = document.getElementById('ownerInput').value;
            const date = document.getElementById('dateInput').value;
            const type = document.getElementById('typeSelect').value;
            const category = document.getElementById('categorySelect').value;
            const detail = document.getElementById('detailInput').value;
            const amount = parseFloat(document.getElementById('amountInput').value);
            const note = document.getElementById('noteInput').value;

            // JSON payload — GAS reads via JSON.parse(e.postData.contents)
            const payload = { owner, date, type, category, detail, amount, note };
            if (this.selectedImageBase64) {
                payload.image_base64 = this.selectedImageBase64;
                payload.image_name = this.selectedImage ? this.selectedImage.name : '';
            }

            console.log('Submitting transaction for:', owner);

            // Content-Type text/plain avoids CORS preflight on GAS
            const response = await fetch(this.appsScriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                this.showFeedback('✓ Transaksi berhasil disimpan!', 'success');
                
                // Refresh owner stats from backend
                if (window.app && window.app.refreshOwnerStats) {
                    await window.app.refreshOwnerStats(owner);
                } else if (result.data && result.data.owner_stats) {
                    if (!window.app.stats) window.app.stats = {};
                    window.app.stats[owner] = result.data.owner_stats;
                    this.updateStatsUI(owner);
                }
                
                this.resetForm();
            } else {
                this.showFeedback(`✗ Gagal: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Submit error:', error);
            this.showFeedback(`✗ Terjadi kesalahan: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    resetForm() {
        this.form.reset();
        this.selectedOwner = null;
        this.selectedImage = null;
        this.selectedImageBase64 = null;
        this.removeImage();
        this.setDefaultDate();
        
        // Reset UI
        document.querySelectorAll('.owner-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('ownerInput').value = '';
        document.getElementById('typeSelect').value = '';
        document.getElementById('categorySelect').innerHTML = '<option value="">-- Pilih Kategori --</option>';
        document.getElementById('quickStats').style.display = 'none';
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('formFeedback');
        feedback.className = `form-feedback ${type}`;
        feedback.textContent = message;
        feedback.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 5000);
    }

    setLoading(isLoading) {
        const loading = document.getElementById('formLoading');
        const submitBtn = document.getElementById('submitBtn');

        if (isLoading) {
            loading.style.display = 'flex';
            submitBtn.disabled = true;
        } else {
            loading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    setAppsScriptUrl(url) {
        this.appsScriptUrl = url;
        console.log('Apps Script URL set to:', url);
    }
}

// Export for use in other modules
window.FormHandler = FormHandler;
