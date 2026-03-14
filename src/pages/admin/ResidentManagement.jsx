import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, StatusBadge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { Home, Mail, Phone, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateCredential } from '../../firebase/credentialService';
import {
    subscribeToResidents,
    createResident,
    updateResident,
} from '../../firebase/residentService';
import {
    assignResidentToFlat,
    subscribeToFlats,
} from '../../firebase/flatService';
import { updateUserProfile } from '../../firebase/userService';
import '../../styles/ResidentManagement.css';

const ResidentManagement = () => {
    const toast = useToast();
    const { user } = useAuth();
    const societyId = user?.societyId || 'default-society';

    const [residents, setResidents] = useState([]);
    const [flats, setFlats] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState(null);
    const [form, setForm] = useState({
        name: '',
        flat: '',
        email: '',
        phone: '',
        status: 'Active',
        password: '',
        confirmPassword: '',
    });

    const openAddModal = () => {
        setEditingResident(null);
        setForm({
            name: '',
            flat: '',
            email: '',
            phone: '',
            status: 'Active',
            password: '',
            confirmPassword: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (resident) => {
        setEditingResident(resident);
        setForm({
            name: resident.name,
            flat: resident.flat,
            email: resident.email,
            phone: resident.phone || '',
            status: resident.status,
            password: '',
            confirmPassword: '',
        });
        setModalOpen(true);
    };

    useEffect(() => {
        const unsubscribe = subscribeToResidents(societyId, setResidents);
        return () => unsubscribe && unsubscribe();
    }, [societyId]);

    useEffect(() => {
        const unsubscribe = subscribeToFlats(societyId, setFlats);
        return () => unsubscribe && unsubscribe();
    }, [societyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const shouldCreateResidentLogin = !editingResident || !editingResident.uid;
        if (shouldCreateResidentLogin) {
            if (!form.password) {
                toast.error('Please set a password for this resident login.', 'Password Required');
                return;
            }
            if (form.password.length < 6) {
                toast.error('Resident password must be at least 6 characters.', 'Password Too Short');
                return;
            }
            if (form.password !== form.confirmPassword) {
                toast.error('Password and confirm password do not match.', 'Password Mismatch');
                return;
            }
        }

        try {
            if (editingResident) {
                let residentUid = editingResident.uid || null;

                if (!residentUid) {
                    const issued = await generateCredential({
                        societyId,
                        email: form.email,
                        role: 'resident',
                        flatNumber: form.flat,
                        name: form.name,
                        password: form.password,
                    });
                    residentUid = issued.uid;
                } else {
                    await updateUserProfile(residentUid, {
                        name: form.name,
                        email: form.email,
                        flatNumber: form.flat,
                        societyId,
                    });
                }

                await updateResident(editingResident.id, {
                    ...form,
                    uid: residentUid || editingResident.uid || null,
                });
                const selectedFlat = flats.find((flat) => String(flat.flatNumber) === String(form.flat));
                if (selectedFlat) {
                    await assignResidentToFlat(selectedFlat.id, residentUid || editingResident.id, form.name);
                }
                toast.success(`${form.name}'s details updated successfully!`, 'Resident Updated');
            } else {
                const issued = await generateCredential({
                    societyId,
                    email: form.email,
                    role: 'resident',
                    flatNumber: form.flat,
                    name: form.name,
                    password: form.password,
                });
                const residentRef = await createResident({
                    name: form.name,
                    flat: form.flat,
                    email: form.email,
                    phone: form.phone,
                    status: form.status,
                    societyId,
                    uid: issued.uid,
                });
                const selectedFlat = flats.find((flat) => String(flat.flatNumber) === String(form.flat));
                if (selectedFlat) {
                    await assignResidentToFlat(selectedFlat.id, issued.uid, form.name);
                }
                toast.success(`${form.name} added to flat ${form.flat}!`, 'Resident Added');
            }
            setModalOpen(false);
            setEditingResident(null);
            setForm({
                name: '',
                flat: '',
                email: '',
                phone: '',
                status: 'Active',
                password: '',
                confirmPassword: '',
            });
        } catch (err) {
            console.error('Resident save failed', err);
            toast.error('Unable to save resident. Please try again.', 'Error');
        }
    };

    const availableFlats = flats.filter((flat) => !flat.residentUid || editingResident?.flat === flat.flatNumber);
    const hasResidents = Array.isArray(residents) && residents.length > 0;
    const requiresCredentialSetup = !editingResident || !editingResident.uid;

    const residentStats = useMemo(() => {
        const total = residents.length;
        const active = residents.filter((r) => String(r.status || '').toLowerCase() === 'active').length;
        const inactive = Math.max(0, total - active);
        return { total, active, inactive };
    }, [residents]);

    const getResidentInitials = (name) => String(name || 'R')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'R';

    return (
        <>
            <PageHeader
                title="Resident Management"
                subtitle="Manage flats and residents"
                action={<Button variant="primary" onClick={openAddModal}>+ Add Resident</Button>}
            />

            {!hasResidents ? (
                <Card className="resident-empty-card">
                    <div className="resident-empty-icon"><Users size={22} /></div>
                    <h3>No residents found</h3>
                    <p>
                        {flats.length > 0
                            ? 'Get started by assigning a resident to one of your flats.'
                            : 'Create flats in onboarding first, then add residents here.'}
                    </p>
                    <Button variant="primary" onClick={openAddModal}>+ Add Resident</Button>
                </Card>
            ) : (
                <>
                    <div className="resident-stats-row">
                        <Card className="resident-stat-card">
                            <div className="resident-stat-icon"><Users size={16} /></div>
                            <div>
                                <p>Total Residents</p>
                                <strong>{residentStats.total}</strong>
                            </div>
                        </Card>
                        <Card className="resident-stat-card">
                            <div className="resident-stat-icon active"><Home size={16} /></div>
                            <div>
                                <p>Active</p>
                                <strong>{residentStats.active}</strong>
                            </div>
                        </Card>
                        <Card className="resident-stat-card">
                            <div className="resident-stat-icon inactive"><Home size={16} /></div>
                            <div>
                                <p>Inactive</p>
                                <strong>{residentStats.inactive}</strong>
                            </div>
                        </Card>
                    </div>

                    <Card className="resident-table-card">
                    <div className="resident-table-wrap">
                        <table className="resident-table">
                            <colgroup>
                                <col />
                                <col />
                                <col />
                                <col />
                                <col style={{ width: '96px' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Flat Number</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th className="align-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {residents.map((resident) => (
                                    <tr key={resident.id}>
                                        <td>
                                            <div className="resident-name-cell">
                                                <span className="resident-avatar">{getResidentInitials(resident.name)}</span>
                                                <div className="resident-name-meta">
                                                    <strong>{resident.name}</strong>
                                                    {resident.phone ? (
                                                        <span><Phone size={12} /> {resident.phone}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="resident-flat-pill">{resident.flat}</span>
                                        </td>
                                        <td>
                                            <span className="resident-email"><Mail size={13} /> {resident.email}</span>
                                        </td>
                                        <td><StatusBadge status={resident.status} /></td>
                                        <td className="align-center">
                                            <Button variant="secondary" size="sm" onClick={() => openEditModal(resident)}>Edit</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </Card>
                </>
            )}

            <Modal isOpen={modalOpen} title={editingResident ? 'Edit Resident' : 'Add New Resident'} onClose={() => setModalOpen(false)}>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" required />
                        </div>
                        <div className="form-group">
                            <label>Flat Number</label>
                            <select value={form.flat} onChange={e => setForm({ ...form, flat: e.target.value })} required>
                                <option value="">Select flat</option>
                                {availableFlats.map((flat) => (
                                    <option key={flat.id} value={flat.flatNumber}>{flat.flatNumber}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                        </div>
                    </div>
                    {requiresCredentialSetup && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="Enter resident password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                    placeholder="Repeat resident password"
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={!editingResident && availableFlats.length === 0}>
                            {editingResident ? 'Save Changes' : 'Add Resident'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default ResidentManagement;
