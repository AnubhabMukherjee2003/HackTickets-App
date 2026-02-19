import React, { useEffect, useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonBadge, IonSpinner, IonRefresher, IonRefresherContent,
  IonIcon, IonChip, IonLabel, IonText, IonSearchbar,
} from '@ionic/react';
import { locationOutline, calendarOutline, ticketOutline, peopleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { getAllEvents, Event } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Tab1.css';

const Tab1: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isLoggedIn } = useAuth();
  const history = useHistory();

  const fetchEvents = async () => {
    try {
      const res = await getAllEvents();
      const active = (res.data as Event[]).filter((e) => e.active);
      setEvents(active);
      setFiltered(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(events.filter((e) =>
      e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    ));
  }, [search, events]);

  const handleBook = (eventId: string | number) => {
    if (!isLoggedIn) {
      history.push('/login', { from: `/book/${eventId}` });
    } else {
      history.push(`/book/${eventId}`);
    }
  };

  const doRefresh = (e: CustomEvent) => {
    fetchEvents().then(() => (e.target as HTMLIonRefresherElement).complete());
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>🎟 Events</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonSearchbar
          value={search}
          onIonInput={(e) => setSearch(String(e.detail.value ?? ''))}
          placeholder="Search events..."
          className="events-search"
          animated
        />

        {loading ? (
          <div className="events-loading">
            <IonSpinner name="crescent" />
            <p>Loading events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="events-empty">
            <IonIcon icon={ticketOutline} />
            <p>No events found</p>
          </div>
        ) : (
          <div className="events-list">
            {filtered.map((ev) => (
              <IonCard key={ev.eventId} className="event-card">
                <IonCardHeader>
                  <div className="event-card-top">
                    <IonCardTitle className="event-name">{ev.name}</IonCardTitle>
                    <IonBadge color={Number(ev.availableTickets) > 10 ? 'success' : Number(ev.availableTickets) > 0 ? 'warning' : 'danger'}>
                      {Number(ev.availableTickets) > 0 ? `${ev.availableTickets} left` : 'Sold Out'}
                    </IonBadge>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div className="event-details">
                    <div className="detail-row">
                      <IonIcon icon={locationOutline} />
                      <span>{ev.location}</span>
                    </div>
                    <div className="detail-row">
                      <IonIcon icon={calendarOutline} />
                      <span>{new Date(Number(ev.date) * 1000).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <IonIcon icon={peopleOutline} />
                      <span>{ev.ticketsSold} / {ev.capacity} booked</span>
                    </div>
                  </div>

                  <div className="event-footer">
                    <IonChip color="secondary" className="price-chip">
                      <IonLabel>{(Number(ev.price) / 1e18).toFixed(4)} ETH</IonLabel>
                    </IonChip>
                    <IonButton
                      size="small"
                      disabled={Number(ev.availableTickets) === 0}
                      onClick={() => handleBook(ev.eventId)}
                      className="book-btn"
                    >
                      {Number(ev.availableTickets) === 0 ? 'Sold Out' : 'Book Now'}
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
