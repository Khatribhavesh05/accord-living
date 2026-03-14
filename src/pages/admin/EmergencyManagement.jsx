import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { 
    Ambulance, Flame, ShieldAlert, Phone, User, Activity,
    Stethoscope, PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveAdminSettings, subscribeAdminSettings } from '../../firebase/appSettingsService';

const EmergencyManagement = () => {
    const { user } = useAuth();
    const societyId = user?.societyId || null;

    const contactTypeMeta = {
        Medical: { icon: Stethoscope, color: '#ef4444' },
        Fire: { icon: Flame, color: '#f97316' },
        Security: { icon: ShieldAlert, color: '#3b82f6' },
        Maintenance: { icon: Activity, color: '#f59e0b' },
        General: { icon: PhoneCall, color: '#6366f1' },
    };

    const [contacts, setContacts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', number: '', type: 'General' });

    React.useEffect(() => {
        if (!societyId) return () => {};
        return subscribeAdminSettings(societyId, (settings) => {
            const list = Array.isArray(settings?.emergencyContacts) ? settings.emergencyContacts : [];
            setContacts(list);
        });
    }, [societyId]);

    // Styles matching existing admin pages
    const styles = {
        pageContainer: {
            maxWidth: '980px',
            margin: '0 auto',
            width: '100%',
            padding: '0 24px',
        },
        headerSection: {
            marginBottom: '32px'
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
            transition: 'background-color 0.2s',
        },
        addForm: {
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f8fafc',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 180px auto auto',
            gap: '10px',
            alignItems: 'end',
        },
        formField: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        formLabel: {
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
        },
        formInput: {
            height: '38px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0 10px',
            fontSize: '14px',
        }
    };

    const handleAddContact = () => {
        const name = newContact.name.trim();
        const number = newContact.number.trim();
        if (!name || !number) {
            return;
        }

        const created = {
            id: `contact-${Date.now()}`,
            name,
            number,
            type: newContact.type,
        };

        const next = [created, ...contacts];
        setContacts(next);
        if (societyId) {
            saveAdminSettings(societyId, { emergencyContacts: next });
        }
        setNewContact({ name: '', number: '', type: 'General' });
        setShowAddForm(false);
    };

    return (
        <div className="emergency-page" style={styles.pageContainer}>
            <div style={styles.headerSection}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#111827' }}>Emergency Contacts</h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Quick-access directory for critical support numbers</p>
            </div>

            <div>
                <div style={styles.sectionCard}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h3 style={styles.sectionTitle}><PhoneCall size={18} /> Contacts Directory</h3>
                            <p style={styles.sectionSubtitle}>Tap the call button to contact support instantly</p>
                        </div>
                        <Button size="sm" onClick={() => setShowAddForm((prev) => !prev)}>
                            {showAddForm ? 'Close' : 'Add Contact'}
                        </Button>
                    </div>
                    {showAddForm && (
                        <div style={styles.addForm}>
                            <div style={styles.formField}>
                                <label style={styles.formLabel}>Name</label>
                                <input
                                    style={styles.formInput}
                                    value={newContact.name}
                                    onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Contact name"
                                />
                            </div>
                            <div style={styles.formField}>
                                <label style={styles.formLabel}>Phone</label>
                                <input
                                    style={styles.formInput}
                                    value={newContact.number}
                                    onChange={(e) => setNewContact((prev) => ({ ...prev, number: e.target.value }))}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div style={styles.formField}>
                                <label style={styles.formLabel}>Type</label>
                                <select
                                    style={styles.formInput}
                                    value={newContact.type}
                                    onChange={(e) => setNewContact((prev) => ({ ...prev, type: e.target.value }))}
                                >
                                    {Object.keys(contactTypeMeta).map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleAddContact}>Save</Button>
                        </div>
                    )}
                    <div>
                        {contacts.map((contact, index) => (
                            <div key={index} style={styles.contactItem}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {(() => {
                                        const meta = contactTypeMeta[contact.type] || contactTypeMeta.General;
                                        const IconComponent = meta.icon;
                                        return (
                                    <div style={{ 
                                        width: '40px', height: '40px', borderRadius: '8px', 
                                        backgroundColor: `${meta.color}15`, color: meta.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <IconComponent size={20} />
                                    </div>
                                        );
                                    })()}
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{contact.name}</div>
                                        <div style={{ color: '#6b7280', fontSize: '13px' }}>{contact.number}</div>
                                    </div>
                                </div>
                                <Button size="sm" style={{ padding: '6px 10px', height: '34px', borderRadius: '8px' }} onClick={() => window.open(`tel:${contact.number}`, '_self')}>
                                    <Phone size={14} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyManagement;
