import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-qrattendence-scanner',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HttpClientModule
  ],
  templateUrl: './qrattendence-scanner.component.html',
  styleUrls: ['./qrattendence-scanner.component.scss']
})
export class QRAttendenceScannerComponent
  implements AfterViewInit, OnDestroy {

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private codeReader = new BrowserQRCodeReader();
  private scannerControls?: IScannerControls;
  private audioCtx?: AudioContext;
  private isProcessing = false;
  private isDialogOpen = false;

  scannedSlug: string | null = null;
  isScanning = false;
  isMarkingAttendance = false;
  statusMessage: string = '';
  statusType: 'success' | 'error' | 'info' = 'info';

  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;
  scanHistory: { slug: string; time: Date; status: string }[] = [];

  baseUrl = environment.API_URL;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) { }

  ngAfterViewInit(): void {
    this.startScanner();
  }

  async startScanner(): Promise<void> {
    if (this.isScanning) return;

    try {
      this.isProcessing = false;
      this.scannedSlug = null;
      this.statusMessage = '';
      this.isScanning = true;

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      this.availableDevices = devices;

      if (!devices.length) {
        this.showStatus('No camera found', 'error');
        this.isScanning = false;
        return;
      }

      if (!this.currentDevice) {
        this.currentDevice = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0];
      }

      this.scannerControls =
        await this.codeReader.decodeFromVideoDevice(
          this.currentDevice.deviceId,
          this.videoElement.nativeElement,
          (result) => {
            if (result && !this.isProcessing && !this.isDialogOpen) {
              const scannedText = result.getText()?.trim();
              if (!scannedText || scannedText === this.scannedSlug) return;

              this.isProcessing = true;
              this.scannedSlug = scannedText;

              console.log('QR Scanned:', scannedText);
              this.playBeep();
              this.showStatus('QR Code scanned! Marking attendance...', 'info');
              this.markAttendance();
            }
          }
        );

    } catch (error) {
      console.error('Camera error:', error);
      this.showStatus('Camera permission denied or unavailable', 'error');
      this.isScanning = false;
    }
  }

  markAttendance(): void {
    if (!this.scannedSlug) {
      this.isProcessing = false;
      return;
    }

    this.isMarkingAttendance = true;

    const payload = {
      in_time: new Date().toISOString(),
      slug: this.scannedSlug,
    };

    this.http.post<any>(`${this.baseUrl}/add_event_user_attendance`, payload)
      .subscribe({
        next: (res) => {
          this.isMarkingAttendance = false;
          const message = res?.message || 'Attendance request processed';
          const status = res?.status;

          this.isDialogOpen = true;

          const dialogRef = this.dialog.open(SuccessDialogComponent, {
            data: { status, message, title: status ? 'Success' : 'Error' },
            maxWidth: '90vw',
            width: '400px',
            panelClass: 'custom-dialog-container'
          });

          dialogRef.afterClosed().subscribe(() => {
            this.isDialogOpen = false;
            if (status === true) {
              this.addToHistory(this.scannedSlug!, 'Success');
            }
            this.scannedSlug = null;
            this.isProcessing = false;
            this.clearStatus();
          });
        },
        error: (err) => {
          this.isMarkingAttendance = false;
          const errorMsg = err.error?.message || err.message || 'Server error, please try again.';
          this.showStatus(errorMsg, 'error');
          this.isDialogOpen = true;

          this.dialog.open(SuccessDialogComponent, {
            data: { status: false, message: errorMsg, title: 'Error' },
            maxWidth: '90vw',
            width: '400px',
            panelClass: 'custom-dialog-container'
          }).afterClosed().subscribe(() => {
            this.isDialogOpen = false;
            this.scannedSlug = null;
            this.isProcessing = false;
          });
        }
      });
  }

  private resetCompletely(): void {
    this.scannedSlug = null;
    this.statusMessage = '';
    this.isMarkingAttendance = false;
    this.isProcessing = false;

    if (!this.isScanning) {
      this.startScanner();
    }
  }

  scanAgain(): void {
    if (this.isMarkingAttendance) return;
    this.resetCompletely();
  }

  stopScanner(): void {
    if (this.scannerControls) {
      this.scannerControls.stop();
      this.scannerControls = undefined;
    }
    this.isScanning = false;
  }

  clearStatus(): void {
    this.statusMessage = '';
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    this.statusMessage = message;
    this.statusType = type;

    if (type === 'info') {
      setTimeout(() => {
        if (this.statusMessage === message) {
          this.statusMessage = '';
        }
      }, 5000);
    }
  }

  toggleCamera(): void {
    if (this.availableDevices.length <= 1) return;

    const currentIndex = this.availableDevices.findIndex(d => d.deviceId === this.currentDevice?.deviceId);
    const nextIndex = (currentIndex + 1) % this.availableDevices.length;
    this.currentDevice = this.availableDevices[nextIndex];

    this.stopScanner();
    setTimeout(() => this.startScanner(), 500);
  }

  private addToHistory(slug: string, status: string): void {
    this.scanHistory.unshift({
      slug,
      time: new Date(),
      status
    });
    if (this.scanHistory.length > 5) {
      this.scanHistory.pop();
    }
  }

  private playBeep(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const oscillator = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      oscillator.start();
      oscillator.stop(this.audioCtx.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play beep sound:', error);
    }
  }

  ngOnDestroy(): void {
    this.stopScanner();
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    if (this.videoElement?.nativeElement?.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.nativeElement.srcObject = null;
    }
  }
}