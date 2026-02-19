import React from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonCard, IonCardContent, IonIcon, IonItem,
  IonLabel, IonList, IonAvatar, IonBadge,
} from '@ionic/react';
import {
  personCircleOutline, phonePortraitOutline, shieldCheckmarkOutline,
  logOutOutline, logInOutline, informationCircleOutline, ticketOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Tab3.css';

const Tab3: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.replace('/tab1');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>👤 Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {isLoggedIn && user ? (
          <>
            {/* User Info Card */}
            <div className="profile-hero">
              <IonIcon icon={personCircleOutline} className="avatar-icon" />
              <div className="profile-info">
                <h2>{user.phone}</h2>
                {user.isAdmin && (
                  <IonBadge color="warning" className="admin-badge">
                    <IonIcon icon={shieldCheckmarkOutline} /> Admin
                  </IonBadge>
                )}
              </div>
            </div>

            <IonList inset>
              <IonItem>
                <IonIcon icon={phonePortraitOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Phone</h3>
                  <p>{user.phone}</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={shieldCheckmarkOutline} slot="start" color={user.isAdmin ? 'warning' : 'medium'} />
                <IonLabel>
                  <h3>Role</h3>
                  <p>{user.isAdmin ? 'Administrator' : 'User'}</p>
                </IonLabel>
              </IonItem>
              <IonItem button routerLink="/tab2">
                <IonIcon icon={ticketOutline} slot="start" color="success" />
                <IonLabel>My Tickets</IonLabel>
              </IonItem>
            </IonList>

            {user.isAdmin && (
              <IonCard className="admin-panel-card">
                <IonCardContent>
                  <p className="admin-panel-hint">Access the full admin panel in a browser:</p>
                  <code className="admin-url">http://localhost:3000/admin</code>
                  <p className="admin-panel-hint">Features: event management, QR scanner, ticket control</p>
                </IonCardContent>
              </IonCard>
            )}

            <div className="profile-actions">
              <IonButton expand="block" color="danger" fill="outline" onClick={handleLogout}>
                <IonIcon slot="start" icon={logOutOutline} />
                Logout
              </IonButton>
            </div>
          </>
        ) : (
          <div className="profile-guest">
            <IonIcon icon={personCircleOutline} className="guest-icon" />
            <h3>Not Logged In</h3>
            <p>Login to manage your tickets and profile</p>
            <IonButton expand="block" onClick={() => history.push('/login')}>
              <IonIcon slot="start" icon={logInOutline} />
              Login
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
