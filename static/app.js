// Prayer Times Calendar - Main Application
class PrayerTimesApp {
  constructor() {
    this.selectedFile = null;
    this.parsedData = null;
    this.expanded = false;
    this.editedTimes = new Set();
    
    this.monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    this.init();
  }

  init() {
    this.initTheme();
    this.setupEventListeners();
    this.updateStepProgress(1);
  }

  // Theme Management
  initTheme() {
    // Theme is already set by inline script to prevent flicker
    const btn = document.getElementById('theme-btn');
    if (btn && document.documentElement.classList.contains('dark')) {
      btn.textContent = '☀️ Light';
    }
  }

  toggleTheme() {
    const root = document.documentElement;
    root.classList.toggle('dark');
    const btn = document.getElementById('theme-btn');
    const dark = root.classList.contains('dark');
    btn.textContent = dark ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  // Event Listeners Setup
  setupEventListeners() {
    // File input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));
    }

    // Drag and drop
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
      uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
      uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
      uploadArea.addEventListener('drop', this.handleDrop.bind(this));
      uploadArea.addEventListener('click', () => fileInput?.click());
      uploadArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      });
    }

    // Global drag overlay
    window.addEventListener('dragover', this.showDragOverlay.bind(this));
    window.addEventListener('dragleave', this.hideDragOverlay.bind(this));
    window.addEventListener('drop', this.hideDragOverlay.bind(this));

    // Keyboard navigation for schedule
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));

    // Window resize handler for sticky actions
    window.addEventListener('resize', () => {
      if (this.parsedData) {
        if (window.innerWidth <= 768) {
          this.showStickyActions();
        } else {
          this.hideStickyActions();
        }
      }
    });
  }

  handleKeyboardNavigation(e) {
    // Only handle navigation when focus is on prayer times
    if (!e.target.classList.contains('prayer-time')) return;

    const currentPrayer = e.target;
    const daySchedule = currentPrayer.closest('.day-schedule');
    const allPrayers = Array.from(daySchedule.querySelectorAll('.prayer-time'));
    const currentIndex = allPrayers.indexOf(currentPrayer);

    let targetPrayer = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        targetPrayer = allPrayers[currentIndex + 1] || allPrayers[0];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        targetPrayer = allPrayers[currentIndex - 1] || allPrayers[allPrayers.length - 1];
        break;
      case 'Home':
        e.preventDefault();
        targetPrayer = allPrayers[0];
        break;
      case 'End':
        e.preventDefault();
        targetPrayer = allPrayers[allPrayers.length - 1];
        break;
    }

    if (targetPrayer) {
      targetPrayer.focus();
    }
  }

  // Step Progress Management
  updateStepProgress(currentStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;
      
      step.classList.toggle('active', isActive);
      step.classList.toggle('completed', isCompleted);
      
      // Update ARIA attributes
      if (isActive) {
        step.setAttribute('aria-current', 'step');
      } else {
        step.removeAttribute('aria-current');
      }
      
      // Announce step changes to screen readers
      if (isActive && currentStep > 1) {
        this.announceToScreenReader(`Now on step ${currentStep}: ${step.querySelector('.step-text').textContent}`);
      }
    });
  }

  // File Handling
  handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select an image file.', 'error');
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToast('File too large. Please select an image under 10MB.', 'error');
      return;
    }

    this.selectedFile = file;
    this.showFileInfo(file);
    this.updateStepProgress(1);

    // Enable upload button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) uploadBtn.disabled = false;
  }

  showFileInfo(file) {
    const fileInfo = document.getElementById('file-info');
    if (!fileInfo) return;

    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const imgPreview = URL.createObjectURL(file);
    
    fileInfo.innerHTML = `
      <img src="${imgPreview}" alt="Preview" aria-label="Image preview" onclick="app.showImageModal('${imgPreview}')" style="cursor: pointer;" />
      <div class="meta">
        <div><strong>File:</strong> <span class="truncate" title="${file.name}">${file.name}</span></div>
        <div><strong>Size:</strong> ${sizeMB} MB</div>
        <div><strong>Type:</strong> ${file.type}</div>
      </div>
    `;
    fileInfo.style.display = 'flex';
  }

  // Drag and Drop Handlers
  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  showDragOverlay(e) {
    if (e.dataTransfer.types.includes('Files')) {
      let overlay = document.getElementById('drag-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'drag-overlay';
        overlay.className = 'drag-overlay';
        overlay.innerHTML = '<div class="drag-message">📸 Drop to parse prayer timetable</div>';
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'flex';
    }
  }

  hideDragOverlay() {
    const overlay = document.getElementById('drag-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // Upload and Parsing
  async uploadFile() {
    if (!this.selectedFile) return;

    const uploadBtn = document.getElementById('upload-btn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');

    // Show skeleton loading state
    uploadBtn.disabled = true;
    this.showSkeletonLoader();
    result.style.display = 'none';
    this.updateStepProgress(2);

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        this.parsedData = data.parsed_data;
        this.hideSkeletonLoader();
        this.showParsedData(data);
        this.updateStepProgress(3);
        this.showToast('Prayer timetable parsed successfully!', 'success');
      } else {
        this.hideSkeletonLoader();
        this.showToast(data.detail || 'Error uploading file', 'error');
        this.updateStepProgress(1);
      }
    } catch (error) {
      this.hideSkeletonLoader();
      this.showToast('Network error: ' + error.message, 'error');
      this.updateStepProgress(1);
    } finally {
      uploadBtn.disabled = false;
    }
  }

  showSkeletonLoader() {
    const loading = document.getElementById('loading');
    loading.innerHTML = `
      <div class="skeleton-container">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton-days">
          ${Array(3).fill().map(() => `
            <div class="skeleton skeleton-day"></div>
          `).join('')}
        </div>
        <div class="skeleton skeleton-text"></div>
      </div>
      <div class="loading-text">
        <div class="spinner"></div>
        <div>Parsing prayer timetable with AI…</div>
      </div>
    `;
    loading.style.display = 'block';
  }

  hideSkeletonLoader() {
    const loading = document.getElementById('loading');
    loading.style.display = 'none';
    loading.innerHTML = `
      <div class="spinner"></div>
      <div>Parsing prayer timetable with AI…</div>
    `;
  }

  // Data Display
  showParsedData(data) {
    const resultDiv = document.getElementById('result');
    const schedule = data.parsed_data.schedule;
    const sanityCheck = data.sanity_check;

    let scheduleHtml = this.renderParseSuccess(data, sanityCheck);
    scheduleHtml += this.renderEditFields(data.parsed_data);
    scheduleHtml += this.renderSchedulePreview(schedule);
    scheduleHtml += this.renderActionButtons();

    resultDiv.innerHTML = scheduleHtml;
    resultDiv.className = 'result success';
    resultDiv.style.display = 'block';

    // Show sticky action bar on mobile
    this.showStickyActions();
  }

  renderParseSuccess(data, sanityCheck) {
    let html = `
      <h3>✅ Prayer timetable parsed successfully!</h3>
    `;

    if (sanityCheck) {
      if (sanityCheck.is_valid) {
        html += `
          <div class="warning sanity-pass">
            <p><strong>✅ Sanity Check: PASSED</strong> - The parsed data looks reasonable.</p>
          </div>
        `;
      } else {
        html += `
          <div class="warning sanity-fail">
            <p><strong>❌ Sanity Check: FAILED</strong> - Potential parsing issues detected:</p>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              ${sanityCheck.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      if (sanityCheck.warnings && sanityCheck.warnings.length > 0) {
        html += `
          <details class="warning sanity-warn">
            <summary><strong>⚠️ Warnings (${sanityCheck.warnings.length})</strong> – Click to expand</summary>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              ${sanityCheck.warnings.map(warning => `<li style="font-size: 0.9em;">${warning}</li>`).join('')}
            </ul>
          </details>
        `;
      }
    }

    return html;
  }

  renderEditFields(parsedData) {
    return `
      <div class="section-spacing">
        <div class="edit-fields">
          <div>
            <label for="city-input">City</label>
            <input id="city-input" value="${parsedData.city}" onchange="app.trackChange('city')">
          </div>
          <div>
            <label for="month-input">Month</label>
            <select id="month-input" onchange="app.trackChange('month')">
              ${this.getMonthOptions(parsedData.month)}
            </select>
          </div>
          <div>
            <label for="year-input">Year</label>
            <input id="year-input" value="${parsedData.year}" type="number" onchange="app.trackChange('year')">
          </div>
        </div>
        <p><strong>Total days found:</strong> ${parsedData.schedule.length}</p>
      </div>
    `;
  }

  renderSchedulePreview(schedule) {
    const previewCount = 3;
    const previewDays = schedule.slice(0, previewCount);
    
    let html = '<div class="section-spacing"><div class="prayer-schedule">';
    
    previewDays.forEach((day, index) => {
      html += this.renderDaySchedule(day, index);
    });

    if (schedule.length > previewCount) {
      const remaining = schedule.slice(previewCount);
      html += `<div id="more-days" class="fade-mask" style="display:none;">`;
      remaining.forEach((day, index) => {
        html += this.renderDaySchedule(day, index + previewCount);
      });
      html += `</div>`;
      html += `<button class="btn secondary-btn expand-toggle" type="button" 
                       onclick="app.toggleExpand()" 
                       id="expand-btn"
                       aria-expanded="false"
                       aria-controls="more-days"
                       aria-label="Show ${schedule.length - previewCount} additional prayer schedule days">
        Show All Days (${schedule.length - previewCount} more)
      </button>`;
    }

    html += '</div></div>';
    return html;
  }

  renderDaySchedule(day, index) {
    const prayers = ['subh', 'sunrise', 'dhuhr', 'sunset', 'maghrib', 'midnight'];
    const prayerLabels = {
      subh: 'Subh',
      sunrise: 'Sunrise', 
      dhuhr: 'Dhuhr',
      sunset: 'Sunset',
      maghrib: 'Maghrib',
      midnight: 'Midnight'
    };

    const hasEdits = prayers.some(prayer => this.editedTimes.has(`${index}-${prayer}`));

    return `
      <div class="day-schedule ${hasEdits ? 'has-edits' : ''}" data-day="${index}">
        <div class="day-header">
          ${day.weekday}, ${day.date}
          ${hasEdits ? '<span class="edit-badge" aria-label="This day has edited times">edited</span>' : ''}
        </div>
        <div class="prayer-times">
          ${prayers.map(prayer => {
            const isEdited = this.editedTimes.has(`${index}-${prayer}`);
            const timeValue = day.prayers[prayer];
            return `
              <div class="prayer-time ${isEdited ? 'edited' : ''}" 
                   onclick="app.editPrayerTime(${index}, '${prayer}')"
                   role="button"
                   tabindex="0"
                   onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.editPrayerTime(${index}, '${prayer}');}"
                   aria-label="Edit ${prayerLabels[prayer]} prayer time. Current time: ${timeValue}">
                <span class="prayer-label">${prayerLabels[prayer]}:</span>
                <span id="time-${index}-${prayer}" class="time-value">${timeValue}</span>
                ${isEdited ? '<span class="edit-indicator" aria-hidden="true">✓</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderActionButtons() {
    return `
      <div class="section-spacing">
        <button class="btn download-btn" onclick="app.downloadCalendar()">
          📅 Download Calendar File (.ics)
        </button>
      </div>
    `;
  }

  // Accessibility Helper
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Utility Functions
  getMonthOptions(selectedMonth) {
    return this.monthNames.map(month => {
      const isSelected = selectedMonth && month.toLowerCase() === selectedMonth.toLowerCase();
      return `<option value="${month}" ${isSelected ? 'selected' : ''}>${month}</option>`;
    }).join('');
  }

  trackChange(field) {
    this.updateChangeTracker();
  }

  updateChangeTracker() {
    const totalChanges = this.editedTimes.size;
    let changeIndicator = document.getElementById('change-indicator');
    
    if (totalChanges > 0) {
      if (!changeIndicator) {
        changeIndicator = document.createElement('div');
        changeIndicator.id = 'change-indicator';
        changeIndicator.className = 'change-badge';
        changeIndicator.setAttribute('aria-live', 'polite');
        document.body.appendChild(changeIndicator);
      }
      
      const text = totalChanges === 1 ? '1 edit pending' : `${totalChanges} edits pending`;
      changeIndicator.textContent = text;
      changeIndicator.style.display = 'block';
    } else if (changeIndicator) {
      changeIndicator.style.display = 'none';
    }
  }

  // Prayer Time Editing
  editPrayerTime(dayIndex, prayerType) {
    const timeElement = document.getElementById(`time-${dayIndex}-${prayerType}`);
    if (!timeElement || timeElement.querySelector('input')) return;

    const currentTime = timeElement.textContent.trim();
    const prayerContainer = timeElement.closest('.prayer-time');
    
    // Create input with better styling and validation
    const input = document.createElement('input');
    input.type = 'time';
    input.value = currentTime; // Keep in 24-hour format
    input.className = 'time-input';
    input.setAttribute('aria-label', `Edit ${prayerType} prayer time (24-hour format)`);
    input.setAttribute('title', 'Use 24-hour format (HH:MM)');
    
    // Add validation attributes
    input.setAttribute('required', 'true');
    input.setAttribute('pattern', '[0-9]{2}:[0-9]{2}');
    
    // Event handlers
    input.addEventListener('blur', () => this.savePrayerTime(dayIndex, prayerType, input, currentTime));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit(timeElement, currentTime);
      }
    });
    
    // Real-time validation
    input.addEventListener('input', (e) => {
      const isValid = this.validateTime(e.target.value);
      e.target.classList.toggle('invalid', !isValid);
    });

    // Replace content with input
    timeElement.innerHTML = '';
    timeElement.appendChild(input);
    input.focus();
    input.select();
    
    // Add editing state to container
    prayerContainer.classList.add('editing');
  }

  validateTime(timeString) {
    if (!timeString) return false;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  savePrayerTime(dayIndex, prayerType, input, originalTime) {
    const newTime = input.value;
    const prayerContainer = input.closest('.prayer-time');
    const timeElement = input.parentElement;
    
    prayerContainer.classList.remove('editing');
    
    if (!newTime || !this.validateTime(newTime)) {
      this.cancelEdit(timeElement, originalTime);
      this.showToast('Invalid time format. Please use HH:MM format.', 'error');
      return;
    }

    // Check if time actually changed
    if (newTime === originalTime) {
      this.cancelEdit(timeElement, originalTime);
      return;
    }

    // Update data - keep in 24-hour format
    if (this.parsedData && this.parsedData.schedule[dayIndex]) {
      this.parsedData.schedule[dayIndex].prayers[prayerType] = newTime;
      this.editedTimes.add(`${dayIndex}-${prayerType}`);
    }

    // Update display - keep in 24-hour format
    timeElement.innerHTML = `${newTime}<span class="edit-indicator" aria-hidden="true">✓</span>`;
    prayerContainer.classList.add('edited');
    
    // Update day header if needed
    const daySchedule = prayerContainer.closest('.day-schedule');
    if (!daySchedule.classList.contains('has-edits')) {
      daySchedule.classList.add('has-edits');
      const dayHeader = daySchedule.querySelector('.day-header');
      if (!dayHeader.querySelector('.edit-badge')) {
        dayHeader.innerHTML += ' <span class="edit-badge" aria-label="This day has edited times">edited</span>';
      }
    }
    
    this.updateChangeTracker();
    this.showToast(`${prayerType.charAt(0).toUpperCase() + prayerType.slice(1)} time updated to ${newTime}`, 'success');
    
    // Update sticky actions if visible
    const stickyBar = document.getElementById('sticky-actions');
    if (stickyBar && stickyBar.style.display !== 'none') {
      this.updateStickyActionStates(stickyBar);
    }
  }

  cancelEdit(timeElement, originalTime) {
    const prayerContainer = timeElement.closest('.prayer-time');
    prayerContainer.classList.remove('editing');
    
    const hasEditIndicator = this.editedTimes.has(timeElement.id.replace('time-', ''));
    timeElement.innerHTML = hasEditIndicator 
      ? `${originalTime}<span class="edit-indicator" aria-hidden="true">✓</span>`
      : originalTime;
  }

  // Expand/Collapse
  toggleExpand() {
    const more = document.getElementById('more-days');
    const btn = document.getElementById('expand-btn');
    if (!more || !btn) return;
    
    this.expanded = !this.expanded;
    more.style.display = this.expanded ? 'block' : 'none';
    
    // Update ARIA attributes
    btn.setAttribute('aria-expanded', this.expanded.toString());
    
    if (this.expanded) {
      more.classList.remove('fade-mask');
      btn.textContent = 'Hide Extra Days';
      btn.setAttribute('aria-label', 'Hide the additional prayer schedule days');
    } else {
      more.classList.add('fade-mask');
      const hiddenCount = more.children.length;
      btn.textContent = `Show All Days (${hiddenCount} more)`;
      btn.setAttribute('aria-label', `Show ${hiddenCount} additional prayer schedule days`);
    }
    
    // Announce to screen readers
    const announcement = this.expanded ? 'All days are now visible' : 'Extra days are now hidden';
    this.announceToScreenReader(announcement);
  }

  // Download
  async downloadCalendar() {
    if (!this.parsedData) return;

    // Show progress feedback
    const downloadBtns = document.querySelectorAll('.download-btn');
    const originalTexts = Array.from(downloadBtns).map(btn => btn.innerHTML);
    
    downloadBtns.forEach(btn => {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-small"></span> Generating...';
    });

    // Update parsedData with values from input fields
    this.parsedData.city = document.getElementById('city-input')?.value || this.parsedData.city;
    this.parsedData.month = document.getElementById('month-input')?.value || this.parsedData.month;
    this.parsedData.year = document.getElementById('year-input')?.value || this.parsedData.year;

    try {
      const response = await fetch('/download-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.parsedData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Sanitize filename
        const city = this.parsedData.city.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const month = this.parsedData.month.toLowerCase();
        const year = this.parsedData.year;
        
        a.download = `prayer_times_${city}_${month}_${year}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Success feedback
        const editsCount = this.editedTimes.size;
        const successMessage = editsCount > 0 
          ? `Calendar downloaded successfully with ${editsCount} custom ${editsCount === 1 ? 'edit' : 'edits'}!`
          : 'Calendar downloaded successfully!';
        
        this.showToast(successMessage, 'success', 7000);
        
        // Clear edit tracking after successful download
        this.editedTimes.clear();
        this.updateChangeTracker();
        
        // Update sticky actions if they exist
        const stickyActions = document.getElementById('sticky-actions');
        if (stickyActions) {
          this.updateStickyActionStates(stickyActions);
        }
        
      } else {
        const error = await response.json();
        this.showToast(error.detail || 'Error downloading calendar', 'error', 8000);
      }
    } catch (error) {
      this.showToast('Network error: ' + error.message, 'error', 8000);
    } finally {
      // Restore button states
      downloadBtns.forEach((btn, index) => {
        btn.disabled = false;
        btn.innerHTML = originalTexts[index];
      });
    }
  }

  // Image Modal
  showImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <img src="${src}" alt="Full size preview" />
          <button class="modal-close" onclick="this.closest('.image-modal').remove()">×</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Sticky Actions (Mobile)
  showStickyActions() {
    if (window.innerWidth <= 768 && this.parsedData) {
      let stickyBar = document.getElementById('sticky-actions');
      if (!stickyBar) {
        stickyBar = document.createElement('div');
        stickyBar.id = 'sticky-actions';
        stickyBar.className = 'sticky-actions';
        stickyBar.setAttribute('role', 'toolbar');
        stickyBar.setAttribute('aria-label', 'Quick actions');
        
        stickyBar.innerHTML = `
          <button class="btn download-btn" onclick="app.downloadCalendar()" aria-describedby="download-hint">
            📅 Download Calendar
          </button>
          <button class="btn secondary-btn" onclick="app.resetAll()" aria-describedby="reset-hint">
            ♻️ Reset
          </button>
          <div class="sr-only" id="download-hint">Download the generated calendar file</div>
          <div class="sr-only" id="reset-hint">Reset the application to start over</div>
        `;
        
        document.body.appendChild(stickyBar);
        
        // Add swipe gesture support
        this.addSwipeSupport(stickyBar);
      }
      
      stickyBar.style.display = 'flex';
      
      // Update button states based on changes
      this.updateStickyActionStates(stickyBar);
    }
  }

  updateStickyActionStates(stickyBar) {
    // Check if stickyBar exists
    if (!stickyBar) return;
    
    const downloadBtn = stickyBar.querySelector('.download-btn');
    // Check if download button exists
    if (!downloadBtn) return;
    
    const hasChanges = this.editedTimes.size > 0;
    
    if (hasChanges) {
      downloadBtn.innerHTML = `📅 Download Calendar <span class="change-indicator-small">${this.editedTimes.size}</span>`;
      downloadBtn.classList.add('has-changes');
    } else {
      downloadBtn.innerHTML = '📅 Download Calendar';
      downloadBtn.classList.remove('has-changes');
    }
  }

  hideStickyActions() {
    const stickyBar = document.getElementById('sticky-actions');
    if (stickyBar) {
      stickyBar.style.display = 'none';
    }
  }

  addSwipeSupport(element) {
    let startY = 0;
    let currentY = 0;
    let isSwipeDown = false;

    element.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      isSwipeDown = false;
    });

    element.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 20) { // Swipe down threshold
        isSwipeDown = true;
        element.style.transform = `translateY(${Math.min(deltaY - 20, 100)}px)`;
      }
    });

    element.addEventListener('touchend', () => {
      if (isSwipeDown && currentY - startY > 60) {
        // Hide temporarily on swipe down
        element.style.transform = 'translateY(100%)';
        setTimeout(() => {
          element.style.transform = '';
        }, 2000);
      } else {
        element.style.transform = '';
      }
      isSwipeDown = false;
    });
  }

  // Toast Notifications
  showToast(message, type = 'info', duration = 5000) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('aria-live', 'polite');
      toastContainer.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    // Add icon based on type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">×</button>
    `;

    toastContainer.appendChild(toast);

    // Add stacking offset for multiple toasts
    const existingToasts = toastContainer.children.length;
    if (existingToasts > 1) {
      toast.style.transform = `translateY(${(existingToasts - 1) * 8}px)`;
    }

    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
      if (toast.parentElement) {
        this.removeToast(toast);
      }
    }, duration);

    // Store timeout ID for manual removal
    toast.dataset.timeoutId = timeoutId;

    // Add click to dismiss
    toast.addEventListener('click', (e) => {
      if (e.target !== toast.querySelector('.toast-close')) {
        this.removeToast(toast);
      }
    });

    return toast;
  }

  removeToast(toast) {
    if (toast.dataset.timeoutId) {
      clearTimeout(parseInt(toast.dataset.timeoutId));
    }
    
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
        this.reorderToasts();
      }
    }, 300);
  }

  reorderToasts() {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    Array.from(toastContainer.children).forEach((toast, index) => {
      toast.style.transform = index > 0 ? `translateY(${index * 8}px)` : '';
    });
  }

  // Reset
  resetAll() {
    // Show confirmation if there are unsaved changes
    if (this.editedTimes.size > 0) {
      const confirmReset = confirm(`You have ${this.editedTimes.size} unsaved ${this.editedTimes.size === 1 ? 'edit' : 'edits'}. Are you sure you want to reset?`);
      if (!confirmReset) return;
    }

    this.selectedFile = null;
    this.parsedData = null;
    this.expanded = false;
    this.editedTimes.clear();
    
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const uploadBtn = document.getElementById('upload-btn');
    const result = document.getElementById('result');
    
    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.style.display = 'none';
    if (uploadBtn) uploadBtn.disabled = true;
    if (result) result.style.display = 'none';
    
    // Hide sticky actions and change tracker
    this.hideStickyActions();
    this.updateChangeTracker();
    
    // Clear any existing toasts
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      toastContainer.innerHTML = '';
    }
    
    this.updateStepProgress(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showToast('Application reset successfully', 'info', 3000);
  }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PrayerTimesApp();
});

// Global functions for backward compatibility
function toggleTheme() { app?.toggleTheme(); }
function resetAll() { app?.resetAll(); }
function uploadFile() { app?.uploadFile(); }
function downloadCalendar() { app?.downloadCalendar(); }
function toggleExpand() { app?.toggleExpand(); }
