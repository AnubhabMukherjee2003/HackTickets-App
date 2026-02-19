import React, { useEffect, useState, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
  IonIcon, IonModal, IonButtons, IonText,
} from '@ionic/react';
import {
  ticketOutline, qrCodeOutline, checkmarkCircle, closeCircle,
  locationOutline, calendarOutline, lockClosedOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import QRCode from 'qrcode';
import { getAllBookings, Ticket } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Tab2.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Tab2: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const history = useHistory();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

  const fetchTickets = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await getAllBookings();
      const data: Ticket[] = res.data;
      setTickets(data);

      // Pre-generate QR codes
      const qrs: Record<string, string> = {};
      for (const t of data) {
        const payload = `${BASE_URL}/verifyme/${t.ticketId}/${user!.token}`;
        qrs[t.ticketId] = await QRCode.toDataURL(payload, { width: 280, margin: 1 });
      }
      setQrMap(qrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [isLoggedIn]);

  const doRefresh = (e: CustomEvent) => {
    fetchTickets().then(() => (e.target as HTMLIonRefresherElement).complete());
  };

  if (!isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary"><IonTitle>My Tickets</IonTitle></IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="not-logged-in">
            <IonIcon icon={lockClosedOutline} />
            <h3>Login Required</h3>
            <p>Please log in to see your tickets</p>
            <IonButton expand="block" onClick={() => history.push('/login', { from: '/tab2' })}>
              Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>🎫 My Tickets</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div className="tickets-loading">
            <IonSpinner name="crescent" />
            <p>Loading tickets…</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="tickets-empty">
            <IonIcon icon={ticketOutline} />
            <p>No tickets yet</p>
            <IonButton fill="outline" routerLink="/tab1">Browse Events</IonButton>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((t) => (
              <IonCard key={t.ticketId} className={`ticket-item ${t.used ? 'used' : ''}`}>
                <IonCardHeader>
                  <div className="ticket-header-row">
                    <IonCardTitle className="ticket-event-name">{t.eventName}</IonCardTitle>
                    <IonBadge color={t.used ? 'medium' : 'success'}>
                      {t.used ? 'Used' : 'Valid'}
                    </IonBadge>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div className="ticket-details">
                    <div className="detail-row">
                      <IonIcon icon={locationOutline} />
                      <span>{t.eventLocation}</span>
                    </div>
                    <div className="detail-row">
                      <IonIcon icon={calendarOutline} />
                      <span>{new Date(Number(t.eventDate) * 1000).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <IonIcon icon={ticketOutline} />
                      <span>Ticket #{t.ticketId}</span>
                    </div>
                  </div>

                  {!t.used && (
                    <IonButton
                      expand="block"
                      fill="outline"
                      size="small"
                      onClick={() => { setSelectedTicket(t); setShowModal(true); }}
                      className="show-qr-btn"
                    >
                      <IonIcon slot="start" icon={qrCodeOutline} />
                      Show Entry QR
                    </IonButton>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>

      {/* QR Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Entry QR Code</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="qr-modal-content">
          {selectedTicket && (
            <div className="qr-modal-body">
              <h3>{selectedTicket.eventName}</h3>
              <p>{selectedTicket.eventLocation}</p>
              {qrMap[selectedTicket.ticketId] ? (
                <img
                  src={qrMap[selectedTicket.ticketId]}
                  alt="Entry QR"
                  className="modal-qr-image"
                />
              ) : (
                <IonSpinner />
              )}
              <p className="qr-instruction">
                📱 Show this QR code at the event entrance
              </p>
              <p className="qr-ticket-id">Ticket #{selectedTicket.ticketId}</p>
              <div className="qr-url-box">
                <p className="qr-url-label">🔗 Verify URL</p>
                <p className="qr-url-text">{`${BASE_URL}/verifyme/${selectedTicket.ticketId}/${user?.token}`}</p>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Tab2;
