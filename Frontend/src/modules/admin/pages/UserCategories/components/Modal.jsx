import React from "react";
import Modal from "../../../../../components/ui/Modal";

/** Thin wrapper — uses shared Modal with body scroll lock + portal. */
const ModalWrapper = ({ isOpen, onClose, title, children, size = "md" }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} contentClassName="p-6">
    {children}
  </Modal>
);

export default ModalWrapper;
