import React, { useState } from 'react';
import { FiArrowRight, FiTrash2, FiPlus, FiPhone, FiUser } from 'react-icons/fi';
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Card,
  ServiceCard,
  ProviderCard,
  BookingCard,
  Badge,
  Avatar,
  EmptyState,
  Spinner,
  SkeletonCard,
  SearchLocationBar,
  Navbar,
  Footer,
} from '../../../components/ui';
import { APP_NAME, colors, gradients } from '../../../theme';
import { showToast } from '../../../utils/toast';
import toast from 'react-hot-toast';
import { initToast } from '../../../utils/toast';

// Ensure toast helpers work on this preview page
initToast(toast);

/**
 * Phase 1–2 design-system showcase.
 * Route: /design-system
 */
const DesignSystemPreview = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-[100dvh] bg-neutral-25 text-neutral-900 font-sans">
      <Navbar
        panel="user"
        locationLabel="Bhopal"
        onLocationClick={() => showToast.info('Location picker hooks in later')}
        rightSlot={
          <Button size="sm" variant="soft" onClick={() => showToast.success('Toast OK')}>
            Toast
          </Button>
        }
      />

      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            Phase 2 deliverable
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            {APP_NAME} Component Library
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Shared UI for Customer · Vendor · Admin — review before panel adoption
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 space-y-16">
        {/* Colors */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Tokens</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Primary', 'bg-primary-500', colors.primary[500]],
              ['Secondary', 'bg-secondary-500', colors.secondary[500]],
              ['Success', 'bg-success-500', colors.success[500]],
              ['Warning', 'bg-warning-500', colors.warning[500]],
              ['Error', 'bg-error-500', colors.error[500]],
              ['Info', 'bg-info-500', colors.info[500]],
            ].map(([label, cls, hex]) => (
              <div key={label} className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                <div className={`h-14 ${cls}`} />
                <div className="px-3 py-2 text-xs">
                  <p className="font-bold">{label}</p>
                  <p className="font-mono text-neutral-500">{hex}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="h-12 rounded-2xl" style={{ background: gradients.brand }} />
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Button</h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={FiArrowRight} iconPosition="right">Primary</Button>
              <Button variant="soft" icon={FiArrowRight} iconPosition="right">Soft</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline" icon={FiPlus}>Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger" icon={FiTrash2}>Danger</Button>
              <Button variant="icon" icon={FiPlus} aria-label="Add" />
              <Button isLoading>Loading</Button>
            </div>
          </Card>
        </section>

        {/* Forms */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Form inputs</h2>
          <Card className="grid sm:grid-cols-2 gap-4">
            <Input label="Full name" placeholder="Rahul Sharma" leftIcon={FiUser} required />
            <Input
              label="Mobile"
              placeholder="9876543210"
              leftIcon={FiPhone}
              prefix="+91"
              hint="OTP will be sent here"
            />
            <Input label="Aadhaar" placeholder="12-digit number" error="Aadhaar must be 12 digits" />
            <Select
              label="Service category"
              options={[
                { value: 'driver', label: 'Driver Booking' },
                { value: 'cook', label: 'Cook / Maharaj' },
                { value: 'plumber', label: 'Plumber' },
              ]}
            />
            <Textarea
              className="sm:col-span-2"
              label="Notes"
              placeholder="Anything the provider should know…"
              hint="Optional"
            />
          </Card>
        </section>

        {/* Search */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Search & location</h2>
          <div className="space-y-3 max-w-lg">
            <SearchLocationBar
              value={search}
              onChange={setSearch}
              rotatingHints={['Electrician', 'Cook', 'AC Service']}
            />
            <SearchLocationBar
              mode="location"
              locationLabel="MP Nagar, Bhopal"
              locationSubLabel="Madhya Pradesh"
              onClick={() => showToast.info('Open city selector')}
            />
          </div>
        </section>

        {/* Badges & Avatar */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Badges & Avatar</h2>
          <Card className="flex flex-wrap items-center gap-3">
            <Badge variant="verified" />
            <Badge variant="rating">4.8</Badge>
            <Badge variant="status" status="journey_started" />
            <Badge variant="status" status="completed" />
            <Badge variant="status" status="cancelled" />
            <Badge variant="status" status="awaiting_payment" />
            <Badge variant="primary">Online</Badge>
            <Badge variant="warning">Cash</Badge>
            <Avatar name="Priya Verma" verified size="lg" />
            <Avatar name="Amit Kumar" size="md" />
            <Spinner />
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Cards</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <ServiceCard title="Electrician" subtitle="Repairs" price={299} badge="HOT" />
            <ServiceCard title="Housekeeping" subtitle="Cleaning" price={499} />
            <ServiceCard title="Driver" subtitle="Hourly" price={199} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ProviderCard
              name="Rajesh Electricals"
              rating={4.7}
              reviewCount={128}
              experience="8 yrs"
              city="Bhopal"
              verified
              services={['Wiring', 'Fan', 'MCB']}
            />
            <BookingCard
              id="BK-1042"
              serviceName="AC Service"
              providerName="CoolAir Pros"
              dateLabel="Today · 4:00 PM"
              amount={899}
              status="in_progress"
              paymentMethod="online"
            />
          </div>
          <SkeletonCard />
        </section>

        {/* Modal + Empty */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Modal & EmptyState</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button
              variant="outline"
              onClick={() => {
                showToast.success('Booked');
                showToast.error('Failed');
                showToast.warning('Pending KYC');
              }}
            >
              Fire toasts
            </Button>
          </div>
          <Card padding="none">
            <EmptyState
              icon="calendar"
              title="No bookings yet"
              message="When you book a service, it will show up here."
              actionLabel="Browse services"
              onAction={() => showToast.info('Navigate home')}
            />
          </Card>
        </section>

        {/* Admin nav preview */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Navbar panels</h2>
          <p className="text-sm text-neutral-500">
            Same component — swap <code className="text-primary-600">panel</code> prop:
            user / vendor / admin
          </p>
          <div className="rounded-2xl border border-neutral-200 overflow-hidden">
            <Navbar panel="vendor" />
          </div>
          <div className="rounded-2xl border border-neutral-200 overflow-hidden">
            <Navbar panel="admin" />
          </div>
        </section>
      </main>

      <Footer panel="user" />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm booking"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                showToast.success('Confirmed');
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          Shared modal with Escape-to-close, backdrop dismiss, and footer actions.
        </p>
      </Modal>
    </div>
  );
};

export default DesignSystemPreview;
