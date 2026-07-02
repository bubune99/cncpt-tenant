/**
 * Shared Grainy admin TSX primitives.
 *
 * Canonical import point for admin screens. The implementations currently
 * live in orders/orders-ui.tsx (first screen to need them); when a primitive
 * outgrows that home, move it here and keep this file the stable path.
 */
export {
  Eyebrow,
  Badge,
  Btn,
  Segment,
  Avatar,
  LiveSearch,
  RowMenu,
  StatCard,
  type SegmentOption,
  type RowMenuItem,
} from './orders/orders-ui'
