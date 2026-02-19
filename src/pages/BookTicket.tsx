import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem,
  IonLabel, IonInput, IonText, IonSpinner, IonBackButton, IonButtons,
  IonBadge, IonIcon, IonProgressBar, IonChip,
} from '@ionic/react';
import {
  cardOutline, checkmarkCircleOutline, ticketOutline,
  qrCodeOutline, calendarOutline, locationOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import QRCode from 'qrcode';
import { getEventById, bookTicket, Event } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './BookTicket.css';

type Step = 'details' | 'payment' | 'processing' | 'success';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BookTicket: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const history = useHistory();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [txHash, setTxHash] = useState('');
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getEventById(eventId)
      .then((r) => setEvent(r.data))
      .catch(() => history.replace('/tab1'));
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [eventId]);

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const handlePayment = async () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setError('Enter a valid 16-digit card number'); return;
    }
    if (!cardName.trim()) { setError('Enter cardholder name'); return; }
    if (!expiry || expiry.length < 5) { setError('Enter valid expiry (MM/YY)'); return; }
    if (!cvv || cvv.length < 3) { setError('Enter valid CVV'); return; }

    setError('');
    setStep('processing');

    // Simulate payment progress
    let prog = 0;
    progressRef.current = setInterval(() => {
      prog += 0.05;
      setProgress(Math.min(prog, 0.9));
    }, 150);

    try {
      // Simulate payment gateway delay (2s)
      await new Promise((r) => setTimeout(r, 2000));

      // Generate a unique payment reference (demo)
      const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      const res = await bookTicket(eventId, paymentRef);
      const { ticketId: tid, transactionHash } = res.data;

      setTicketId(tid);
      setTxHash(transactionHash);

      // Generate QR — encodes the URL the admin will scan
      const qrPayload = `${BASE_URL}/verifyme/${tid}/${user!.token}`;
      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);

      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(1);
      setTimeout(() => setStep('success'), 400);
    } catch (e: any) {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(0);
      setStep('payment');
      setError(e.response?.data?.error || 'Booking failed. Try again.');
    }
  };

  const priceInEth = event ? (Number(event.price) / 1e18).toFixed(4) : '0';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle>Book Ticket</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="book-content">
        {!event ? (
          <div className="book-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : step === 'details' ? (
          // ── Step 1: Event Details ──────────────────────────────────────────
          <div className="book-container">
            <IonCard className="event-summary-card">
              <IonCardHeader>
                <IonChip color="success">
                  <IonLabel>Active Event</IonLabel>
                </IonChip>
                <IonCardTitle>{event.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="event-meta">
                  <div className="meta-row">
                    <IonIcon icon={locationOutline} />
                    <span>{event.location}</span>
                  </div>
                  <div className="meta-row">
                    <IonIcon icon={calendarOutline} />
                    <span>{new Date(Number(event.date) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="meta-row">
                    <IonIcon icon={ticketOutline} />
                    <span>{event.availableTickets} tickets left</span>
                  </div>
                </div>
                <div className="price-box">
                  <span className="price-label">Price</span>
                  <span className="price-value">{priceInEth} ETH</span>
                  <span className="price-sub">≈ Demo payment</span>
                </div>
              </IonCardContent>
            </IonCard>

            <IonButton expand="block" onClick={() => setStep('payment')} className="proceed-btn">
              Proceed to Payment
            </IonButton>
          </div>
        ) : step === 'payment' ? (
          // ── Step 2: Payment Gateway ────────────────────────────────────────
          <div className="book-container">
            <IonCard className="payment-card">
              <IonCardHeader>
                <div className="payment-header">
                  <IonIcon icon={cardOutline} />
                  <IonCardTitle>Payment Details</IonCardTitle>
                </div>
                <IonBadge color="warning">Demo Gateway</IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <div className="amount-row">
                  <span>Amount</span>
                  <strong>{priceInEth} ETH — {event.name}</strong>
                </div>

                <IonItem lines="full" className="pay-input">
                  <IonLabel position="stacked">Card Number</IonLabel>
                  <IonInput
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    inputmode="numeric"
                    onIonInput={(e) => setCardNumber(formatCard(String(e.detail.value ?? '')))}
                  />
                </IonItem>

                <IonItem lines="full" className="pay-input">
                  <IonLabel position="stacked">Cardholder Name</IonLabel>
                  <IonInput
                    placeholder="John Doe"
                    value={cardName}
                    onIonInput={(e) => setCardName(String(e.detail.value ?? ''))}
                  />
                </IonItem>

                <div className="pay-row">
                  <IonItem lines="full" className="pay-input half">
                    <IonLabel position="stacked">Expiry</IonLabel>
                    <IonInput
                      placeholder="MM/YY"
                      value={expiry}
                      inputmode="numeric"
                      maxlength={5}
                      onIonInput={(e) => setExpiry(formatExpiry(String(e.detail.value ?? '')))}
                    />
                  </IonItem>
                  <IonItem lines="full" className="pay-input half">
                    <IonLabel position="stacked">CVV</IonLabel>
                    <IonInput
                      type="password"
                      placeholder="123"
                      value={cvv}
                      inputmode="numeric"
                      maxlength={4}
                      onIonInput={(e) => setCvv(String(e.detail.value ?? ''))}
                    />
                  </IonItem>
                </div>

                {error && (
                  <IonText color="danger">
                    <p className="pay-error">{error}</p>
                  </IonText>
                )}

                <IonButton expand="block" onClick={handlePayment} className="pay-btn">
                  Pay & Book Ticket
                </IonButton>

                <p className="pay-disclaimer">
                  🔒 This is a demo gateway — no real payment is processed
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        ) : step === 'processing' ? (
          // ── Step 3: Processing ─────────────────────────────────────────────
          <div className="processing-container">
            <IonSpinner name="crescent" />
            <h3>Processing your booking…</h3>
            <p>Minting ticket on the blockchain</p>
            <IonProgressBar value={progress} color="primary" />
          </div>
        ) : (
          // ── Step 4: Success + QR Code ─────────────────────────────────────
          <div className="success-container">
            <IonIcon icon={checkmarkCircleOutline} className="success-icon" />
            <h2>Ticket Booked!</h2>
            <p>Your ticket has been minted on-chain</p>

            <IonCard className="ticket-card">
              <IonCardHeader>
                <IonCardTitle>{event.name}</IonCardTitle>
                <p className="ticket-meta">{event.location}</p>
              </IonCardHeader>
              <IonCardContent>
                <div className="ticket-info-row">
                  <span>Ticket ID</span><strong>#{ticketId}</strong>
                </div>
                <div className="ticket-info-row">
                  <span>Phone</span><strong>{user?.phone}</strong>
                </div>
                <div className="ticket-info-row">
                  <span>Date</span>
                  <strong>{new Date(Number(event.date) * 1000).toLocaleDateString()}</strong>
                </div>

                {qrDataUrl && (
                  <div className="qr-wrapper">
                    <img src={qrDataUrl} alt="Entry QR Code" className="qr-image" />
                    <p className="qr-hint">Show this QR at the event entrance</p>
                    <div className="qr-url-box">
                      <p className="qr-url-label">🔗 Verify URL</p>
                      <p className="qr-url-text">{`${BASE_URL}/verifyme/${ticketId}/${user?.token}`}</p>
                    </div>
                  </div>
                )}

                <div className="tx-hash">
                  <IonIcon icon={qrCodeOutline} />
                  <span>Tx: {txHash.slice(0, 20)}…</span>
                </div>
              </IonCardContent>
            </IonCard>

            <IonButton expand="block" routerLink="/tab2" className="view-tickets-btn">
              View My Tickets
            </IonButton>
            <IonButton expand="block" fill="outline" routerLink="/tab1">
              Back to Events
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BookTicket;
