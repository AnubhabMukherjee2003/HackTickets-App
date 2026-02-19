import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonCard,
  IonCardContent, IonCardHeader, IonCardTitle, IonSpinner,
  IonBackButton, IonButtons, IonIcon, IonNote,
} from '@ionic/react';
import { phonePortraitOutline, keyOutline, ticketOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

interface LocationState {
  from?: string;
}

const Login: React.FC = () => {
  const history = useHistory();
  const location = useLocation<LocationState>();
  const { login } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState(''); // shown in dev mode

  const redirectTo = location.state?.from || '/tab2';

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.data.otp) setDevOtp(res.data.otp); // dev mode
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Enter the OTP sent to your number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      const { token, user } = res.data;
      login(token, user.phone, user.isAdmin);
      history.replace(redirectTo);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab2" />
          </IonButtons>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          {/* Logo / Branding */}
          <div className="login-logo">
            <IonIcon icon={ticketOutline} />
            <h2>HackTickets</h2>
            <p>Your decentralized event platform</p>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle>
                {step === 'phone' ? 'Enter Phone Number' : 'Verify OTP'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {step === 'phone' ? (
                <>
                  <IonItem lines="full" className="login-input">
                    <IonIcon slot="start" icon={phonePortraitOutline} />
                    <IonLabel position="stacked">Mobile Number</IonLabel>
                    <IonInput
                      type="tel"
                      placeholder="10-digit number"
                      value={phone}
                      maxlength={10}
                      inputmode="numeric"
                      onIonInput={(e) => setPhone(String(e.detail.value ?? ''))}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </IonItem>
                  <IonNote className="login-hint">
                    No country code needed — just 10 digits
                  </IonNote>

                  {error && (
                    <IonText color="danger">
                      <p className="login-error">{error}</p>
                    </IonText>
                  )}

                  <IonButton
                    expand="block"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="login-btn"
                  >
                    {loading ? <IonSpinner name="dots" /> : 'Send OTP'}
                  </IonButton>
                </>
              ) : (
                <>
                  <p className="otp-subtitle">
                    OTP sent to <strong>{phone}</strong>
                  </p>

                  {devOtp && (
                    <div className="dev-otp-banner">
                      🧪 Dev mode OTP: <strong>{devOtp}</strong>
                    </div>
                  )}

                  <IonItem lines="full" className="login-input">
                    <IonIcon slot="start" icon={keyOutline} />
                    <IonLabel position="stacked">OTP Code</IonLabel>
                    <IonInput
                      type="number"
                      placeholder="6-digit OTP"
                      value={otp}
                      maxlength={6}
                      inputmode="numeric"
                      onIonInput={(e) => setOtp(String(e.detail.value ?? ''))}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                    />
                  </IonItem>

                  {error && (
                    <IonText color="danger">
                      <p className="login-error">{error}</p>
                    </IonText>
                  )}

                  <IonButton
                    expand="block"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="login-btn"
                  >
                    {loading ? <IonSpinner name="dots" /> : 'Verify & Login'}
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); setDevOtp(''); }}
                  >
                    Change Number
                  </IonButton>
                </>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
