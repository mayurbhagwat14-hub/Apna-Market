import React from 'react';
import { FiStar, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import Card from './Card';
import Avatar from './Avatar';
import Badge from './Badge';

/** Category / service tile for grids */
export const ServiceCard = ({
  title,
  subtitle,
  icon,
  image,
  price,
  badge,
  onClick,
  className = '',
}) => (
  <Card
    interactive
    onClick={onClick}
    padding="sm"
    className={`flex flex-col items-center text-center gap-2 ${className}`}
  >
    <div className="relative w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center overflow-hidden">
      {image ? (
        <img src={image} alt="" className="w-10 h-10 object-contain" loading="lazy" />
      ) : (
        icon || <span className="text-primary-500 text-xl font-bold">{title?.[0]}</span>
      )}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5">
          <Badge variant="error" size="sm">
            {badge}
          </Badge>
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-bold text-neutral-900 line-clamp-2">{title}</p>
      {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{subtitle}</p>}
      {price != null && (
        <p className="text-xs font-semibold text-primary-600 mt-1">₹{price}</p>
      )}
    </div>
  </Card>
);

/** Provider / vendor summary card */
export const ProviderCard = ({
  name,
  photo,
  rating,
  reviewCount,
  experience,
  city,
  verified = false,
  services = [],
  onClick,
  className = '',
}) => (
  <Card interactive={Boolean(onClick)} onClick={onClick} className={className}>
    <div className="flex gap-3">
      <Avatar src={photo} name={name} size="lg" verified={verified} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-neutral-900 truncate">{name}</h3>
          {verified && <Badge variant="verified" size="sm" />}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
          {rating != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-warning-600">
              <FiStar className="w-3.5 h-3.5 fill-current" aria-hidden />
              {Number(rating).toFixed(1)}
              {reviewCount != null && (
                <span className="text-neutral-400 font-medium">({reviewCount})</span>
              )}
            </span>
          )}
          {experience && <span>· {experience}</span>}
        </div>
        {city && (
          <p className="flex items-center gap-1 text-xs text-neutral-500 mt-1.5 truncate">
            <FiMapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {city}
          </p>
        )}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {services.slice(0, 3).map((s) => (
              <Badge key={s} variant="neutral" size="sm">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  </Card>
);

/** Booking list / history card */
export const BookingCard = ({
  id,
  serviceName,
  providerName,
  dateLabel,
  amount,
  status,
  paymentMethod,
  onClick,
  className = '',
}) => (
  <Card interactive={Boolean(onClick)} onClick={onClick} className={className}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-400">#{id}</p>
        <h3 className="font-bold text-neutral-900 truncate mt-0.5">{serviceName}</h3>
        {providerName && (
          <p className="text-sm text-neutral-500 truncate mt-0.5 flex items-center gap-1">
            <FiCheckCircle className="w-3.5 h-3.5 text-success-500 shrink-0" aria-hidden />
            {providerName}
          </p>
        )}
        {dateLabel && <p className="text-xs text-neutral-500 mt-2">{dateLabel}</p>}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        {status && <Badge variant="status" status={status} />}
        {amount != null && (
          <p className="text-sm font-extrabold text-neutral-900">₹{amount}</p>
        )}
        {paymentMethod && (
          <Badge variant="neutral" size="sm">
            {paymentMethod === 'online' ? 'Online' : paymentMethod === 'pay_at_home' || paymentMethod === 'cash' ? 'Cash' : paymentMethod}
          </Badge>
        )}
      </div>
    </div>
  </Card>
);

export default ServiceCard;
