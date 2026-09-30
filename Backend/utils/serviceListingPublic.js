const { LISTING_STATUS } = require('./constants');
const { buildHighlights, pricingRows, toPublicCatalogItems } = require('./listingPayload');

/**
 * Listings customers may see: currently approved, or pending re-review
 * while an approved snapshot is still live.
 */
const LIVE_PUBLIC_QUERY = {
  $or: [
    { status: LISTING_STATUS.APPROVED },
    {
      status: LISTING_STATUS.PENDING_REVIEW,
      hasPendingEdits: true,
      approvedVersion: { $ne: null }
    }
  ]
};

const overlayApprovedVersion = (listing) => {
  if (!listing) return listing;
  const obj = typeof listing.toObject === 'function' ? listing.toObject() : { ...listing };

  if (
    obj.status === LISTING_STATUS.PENDING_REVIEW &&
    obj.hasPendingEdits &&
    obj.approvedVersion
  ) {
    return {
      ...obj,
      ...obj.approvedVersion,
      _id: obj._id,
      vendorId: obj.vendorId,
      categoryId: obj.categoryId,
      categoryName: obj.approvedVersion.categoryName || obj.categoryName,
      status: LISTING_STATUS.APPROVED,
      hasPendingEdits: true
    };
  }

  return obj;
};

const isVendorPubliclyActive = (vendor) => {
  if (!vendor || !vendor._id) return false;
  if (vendor.approvalStatus && vendor.approvalStatus !== 'approved') return false;
  if (vendor.accountStatus === 'SUSPENDED' || vendor.accountStatus === 'BLOCKED') return false;
  return true;
};

const listingDisplayPrice = (pricing = {}) =>
  pricing.basePrice ||
  pricing.hourlyRate ||
  pricing.dailyRate ||
  pricing.packagePrice ||
  pricing.monthlyRent ||
  pricing.yearlyRent ||
  pricing.visitingCharge ||
  pricing.perGuardRate ||
  0;

const toPublicListingDto = (listing) => {
  const live = overlayApprovedVersion(listing);
  const vendor = live.vendorId;
  const category = live.categoryId;

  if (!isVendorPubliclyActive(vendor)) return null;

  const schema = category?.vendorFormSchema || [];
  const answers = live.dynamicFormAnswers || {};
  const catalogItems = toPublicCatalogItems(live.catalogItems || [], category?.catalogItemSchema || []);
  const itemPrices = catalogItems.map((item) => item.price).filter((n) => n > 0);
  const displayPrice = itemPrices.length ? Math.min(...itemPrices) : listingDisplayPrice(live.pricing);

  return {
    id: live._id.toString(),
    title: live.title,
    description: live.description,
    shortDescription: live.shortDescription || '',
    experience: live.experience || 0,
    languages: live.languages || [],
    pricingModel: live.pricingModel,
    bookingMode: live.bookingMode,
    bookingConfig: live.bookingConfig || {},
    pricing: live.pricing || {},
    pricingRows: pricingRows(live.pricing),
    displayPrice,
    catalogItems,
    itemCount: catalogItems.length,
    availability: live.availability || {},
    serviceArea: live.serviceArea || {},
    cancellation: live.cancellation || {},
    dynamicFormAnswers: answers,
    highlights: [
      ...buildHighlights(answers, schema),
      ...buildHighlights(live.pricingFormAnswers || {}, category?.pricingFormSchema || []),
      ...buildHighlights(live.availabilityFormAnswers || {}, category?.availabilityFormSchema || []),
      ...buildHighlights(live.serviceAreaFormAnswers || {}, category?.serviceAreaFormSchema || []),
      ...buildHighlights(live.bookingRulesFormAnswers || {}, category?.bookingRulesFormSchema || [])
    ],
    portfolioPhotos: live.portfolioPhotos || [],
    portfolioVideos: live.portfolioVideos || [],
    documents: (live.documents || []).map((d) => ({
      label: d.label,
      url: d.url,
      type: d.type
    })),
    serviceAreaRadiusKm: live.serviceAreaRadiusKm || live.serviceArea?.radiusKm || 10,
    category: {
      id: category?._id?.toString() || category?.id,
      title: category?.title || live.categoryName,
      slug: category?.slug,
      icon: category?.homeIconUrl,
      bookingMode: category?.bookingMode || 'BOTH',
      serviceFulfillmentType: category?.serviceFulfillmentType || 'ON_SITE',
      paymentConfig: category?.paymentConfig || { requireAdvancePayment: false, advancePaymentPercent: 0 }
    },
    provider: {
      id: vendor._id.toString(),
      name: vendor.name,
      photo: vendor.profilePhoto,
      rating: vendor.rating || 4.8,
      reviews: vendor.totalReviews || 0,
      completedJobs: vendor.completedJobs || 0,
      city: vendor.address?.city
    }
  };
};

const isListingBookable = (listing) => {
  if (!listing) return false;
  if (listing.status === LISTING_STATUS.APPROVED) return true;
  return Boolean(
    listing.status === LISTING_STATUS.PENDING_REVIEW &&
    listing.hasPendingEdits &&
    listing.approvedVersion
  );
};

module.exports = {
  LIVE_PUBLIC_QUERY,
  overlayApprovedVersion,
  toPublicListingDto,
  isListingBookable,
  listingDisplayPrice
};
