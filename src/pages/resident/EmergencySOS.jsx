import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Button } from '../../components/ui';
import { Phone, ShieldAlert, Flame, Stethoscope, Activity, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeAdminSettings } from '../../firebase/appSettingsService';
import './EmergencySOS.css';

const EmergencySOS = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);

    const typeMeta = useMemo(() => ({
        Medical: { icon: Stethoscope, color: '#ef4444' },
        Fire: { icon: Flame, color: '#f97316' },
        Security: { icon: ShieldAlert, color: '#3b82f6' },
        Maintenance: { icon: Activity, color: '#f59e0b' },
        General: { icon: PhoneCall, color: '#6366f1' },
    }), []);

    useEffect(() => {
        if (!user?.societyId) {
            setContacts([]);
            return () => {};
        }

        return subscribeAdminSettings(user.societyId, (settings) => {
            const list = Array.isArray(settings?.emergencyContacts) ? settings.emergencyContacts : [];
            setContacts(list);
        });
    }, [user?.societyId]);

    const styles = {
        pageContainer: {
            maxWidth: '980px',
            margin: '0 auto',
            width: '100%',
            padding: '0 24px',
        },
        sectionCard: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
        },
        sectionHeader: {
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
            gap: '12px',
        },
        sectionTitle: {
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        sectionSubtitle: {
            margin: '4px 0 0',
            color: '#6b7280',
            fontSize: '13px',
        },
        contactItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid #f3f4f6',
        },
    };

    return (
        <>
            <PageHeader title="Contacts" subtitle="Quick-access directory for critical support numbers" />

            <div className="emergency-page" style={styles.pageContainer}>
                <div style={styles.sectionCard}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h3 style={styles.sectionTitle}><PhoneCall size={18} /> Contacts Directory</h3>
                            <p style={styles.sectionSubtitle}>Same contacts set by admin are available here</p>
                        </div>
                    </div>

                    <div>
                        {contacts.length === 0 ? (
                            <div style={{ padding: '24px', color: '#6b7280', textAlign: 'center' }}>No contacts available yet</div>
                        ) : (
                            contacts.map((contact, index) => {
                                const meta = typeMeta[contact.type] || typeMeta.General;
                                const IconComponent = meta.icon;
                                return (
                                    <div key={`${contact.name}-${index}`} style={styles.contactItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '8px', 
                                                backgroundColor: `${meta.color}15`, color: meta.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <IconComponent size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{contact.name}</div>
                                                <div style={{ color: '#6b7280', fontSize: '13px' }}>{contact.number}</div>
                                            </div>
                                        </div>
                                        <Button size="sm" style={{ padding: '6px 10px', height: '34px', borderRadius: '8px' }} onClick={() => window.open(`tel:${contact.number}`, '_self')}>
                                            <Phone size={14} />
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmergencySOS;
