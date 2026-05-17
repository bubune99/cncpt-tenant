'use client';

/**
 * Atlas Customer Addresses (D8 — part 1)
 * Full CRUD for shipping/billing addresses.
 * Uses --wl-* tokens exclusively.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  useCustomerAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type CustomerAddress,
} from '@/components/cms/account-dashboard/hooks';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: 'var(--wl-font-body)',
  fontSize: 13,
  background: 'var(--wl-bg)',
  border: '1px solid var(--wl-rule)',
  borderRadius: 'var(--wl-radius-sm)',
  color: 'var(--wl-text)',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--wl-font-mono)',
  fontSize: 10,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--wl-text-soft)',
  marginBottom: 5,
};

type FormData = {
  label: string;
  firstName: string;
  lastName: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

const DEFAULT_FORM: FormData = {
  label: '',
  firstName: '',
  lastName: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export default function AddressesPage() {
  const { addresses, isLoading, mutate } = useCustomerAddresses();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
  };

  const handleEdit = (address: CustomerAddress) => {
    setFormData({
      label: address.label ?? '',
      firstName: address.firstName ?? '',
      lastName: address.lastName ?? '',
      street1: address.street1,
      street2: address.street2 ?? '',
      city: address.city,
      state: address.state ?? '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? '',
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateAddress(editingId, formData);
      } else {
        await createAddress(formData);
      }
      await mutate();
      setIsAdding(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this address?')) return;
    try {
      await deleteAddress(id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  return (
    <div>
      {/* Page head */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          paddingBottom: 18,
          borderBottom: '1px solid var(--wl-rule)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--wl-font-mono)',
              fontSize: 10.5,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--wl-text-soft)',
              marginBottom: 6,
            }}
          >
            <Link href="/account" style={{ color: 'var(--wl-text-soft)', textDecoration: 'none' }}>Account</Link>
            <span style={{ color: 'var(--wl-text-faint)', margin: '0 6px' }}>/</span>
            <span style={{ color: 'var(--wl-text)' }}>Addresses</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontWeight: 500,
              fontSize: 38,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Saved <em style={{ fontStyle: 'italic', fontWeight: 400 }}>addresses</em>
          </h1>
          <div
            style={{
              fontFamily: 'var(--wl-font-display)',
              fontStyle: 'italic',
              color: 'var(--wl-text-soft)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {isLoading ? 'Loading…' : `${addresses.length} saved · faster checkout`}
          </div>
        </div>
        {!isAdding && (
          <div style={{ paddingTop: 12 }}>
            <button
              onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '5px 12px',
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                cursor: 'pointer',
              }}
            >
              + Add address
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'color-mix(in srgb, var(--wl-error) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--wl-error) 30%, transparent)',
            borderRadius: 'var(--wl-radius-sm)',
            fontFamily: 'var(--wl-font-body)',
            fontSize: 13,
            color: 'var(--wl-error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--wl-surface)',
            border: '1px solid var(--wl-rule)',
            borderRadius: 'var(--wl-radius)',
            padding: '20px 22px',
            marginTop: 20,
          }}
        >
          <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
            {editingId ? 'Edit address' : 'New address'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Label (e.g. Home, Work)</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Home"
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>First name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Last name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Street address *</label>
              <input
                type="text"
                required
                value={formData.street1}
                onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Apt, suite, etc.</label>
              <input
                type="text"
                value={formData.street2}
                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>ZIP *</label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { key: 'isDefaultShipping', label: 'Default shipping' },
                { key: 'isDefaultBilling',  label: 'Default billing' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData[key as keyof FormData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    style={{ width: 14, height: 14, accentColor: 'var(--wl-accent)' }}
                  />
                  <span style={{ fontFamily: 'var(--wl-font-body)', fontSize: 13, color: 'var(--wl-text-soft)' }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '6px 12px',
                border: '1px solid var(--wl-rule)',
                color: 'var(--wl-text-soft)',
                borderRadius: 'var(--wl-radius-sm)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--wl-font-body)',
                fontSize: 12,
                padding: '6px 14px',
                background: 'var(--wl-text)',
                color: 'var(--wl-bg)',
                border: '1px solid var(--wl-text)',
                borderRadius: 'var(--wl-radius-sm)',
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update' : 'Save'} address
            </button>
          </div>
        </form>
      )}

      {/* Address list */}
      <div style={{ marginTop: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--wl-text-faint)', fontFamily: 'var(--wl-font-display)', fontStyle: 'italic' }}>
            Loading…
          </div>
        ) : addresses.length === 0 && !isAdding ? (
          <div
            style={{
              background: 'var(--wl-surface)',
              border: '1px solid var(--wl-rule)',
              borderRadius: 'var(--wl-radius)',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--wl-font-display)', fontSize: 18, fontWeight: 500, marginBottom: 6 }}>
              No addresses saved
            </div>
            <div style={{ fontFamily: 'var(--wl-font-display)', fontStyle: 'italic', color: 'var(--wl-text-soft)', fontSize: 13 }}>
              Add an address to make checkout faster.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {addresses.map((address) => (
              <div
                key={address.id}
                style={{
                  background: 'var(--wl-surface)',
                  border: address.isDefaultShipping ? '1px solid var(--wl-accent)' : '1px solid var(--wl-rule)',
                  borderRadius: 'var(--wl-radius)',
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--wl-font-display)', fontWeight: 500, fontSize: 14 }}>
                    {address.label ?? 'Address'}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {address.isDefaultShipping && (
                      <span
                        style={{
                          fontFamily: 'var(--wl-font-mono)',
                          fontSize: 9,
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          color: 'var(--wl-accent)',
                          border: '1px solid var(--wl-accent)',
                          borderRadius: 999,
                          padding: '1px 6px',
                        }}
                      >
                        Shipping
                      </span>
                    )}
                    {address.isDefaultBilling && (
                      <span
                        style={{
                          fontFamily: 'var(--wl-font-mono)',
                          fontSize: 9,
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          color: 'var(--wl-success)',
                          border: '1px solid var(--wl-success)',
                          borderRadius: 999,
                          padding: '1px 6px',
                        }}
                      >
                        Billing
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--wl-font-body)', fontSize: 13, color: 'var(--wl-text-soft)', lineHeight: 1.55 }}>
                  {(address.firstName || address.lastName) && (
                    <div style={{ fontWeight: 500, color: 'var(--wl-text)' }}>
                      {address.firstName} {address.lastName}
                    </div>
                  )}
                  <div>{address.street1}</div>
                  {address.street2 && <div>{address.street2}</div>}
                  <div>{address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}</div>
                  <div>{address.country}</div>
                  {address.phone && <div style={{ color: 'var(--wl-text-faint)', fontSize: 12 }}>{address.phone}</div>}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--wl-rule)',
                  }}
                >
                  <button
                    onClick={() => handleEdit(address)}
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 10,
                      letterSpacing: '.04em',
                      color: 'var(--wl-accent)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    style={{
                      fontFamily: 'var(--wl-font-mono)',
                      fontSize: 10,
                      letterSpacing: '.04em',
                      color: 'var(--wl-error)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
