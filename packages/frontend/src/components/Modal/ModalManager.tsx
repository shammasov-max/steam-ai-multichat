import React from 'react'
import Modal from './Modal'
import AccountsModal from './modals/AccountsModal'
import ProxyModal from './modals/ProxyModal'
import FriendsModal from './modals/FriendsModal'
import SettingsModal from './modals/SettingsModal'
import ActionsModal from './modals/ActionsModal'
import { ModalState, Account, Friend } from '../../types'

interface ModalManagerProps {
  modalState: ModalState
  onClose: () => void
  accounts: Account[]
  friends: Friend[]
}

const ModalManager: React.FC<ModalManagerProps> = ({
  modalState,
  onClose,
  accounts,
  friends
}) => {
  const getModalContent = () => {
    switch (modalState.type) {
      case 'accounts':
        return (
          <Modal isOpen={modalState.isOpen} onClose={onClose} title="Account Management" size="lg">
            <AccountsModal accounts={accounts} />
          </Modal>
        )
      case 'proxy':
        return (
          <Modal isOpen={modalState.isOpen} onClose={onClose} title="Proxy Management" size="lg">
            <ProxyModal />
          </Modal>
        )
      case 'friends':
        return (
          <Modal isOpen={modalState.isOpen} onClose={onClose} title="Friends Management" size="xl">
            <FriendsModal friends={friends} />
          </Modal>
        )
      case 'settings':
        return (
          <Modal isOpen={modalState.isOpen} onClose={onClose} title="Settings" size="lg">
            <SettingsModal />
          </Modal>
        )
      case 'actions':
        return (
          <Modal isOpen={modalState.isOpen} onClose={onClose} title="Bot Actions" size="lg">
            <ActionsModal />
          </Modal>
        )
      default:
        return null
    }
  }

  return <>{getModalContent()}</>
}

export default ModalManager
