'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAddress, isConnected, isAllowed } from '@stellar/freighter-api';
import { useToast } from './ToastProvider';
import InstallFreighterModal from './InstallFreighterModal';

interface WalletContextType {
  publicKey: string | null;
  isWalletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem('stellar_wallet_public_key');
    if (storedKey) {
      setPublicKey(storedKey);
      setIsWalletConnected(true);
    } else {
      checkWalletConnection();
    }
  }, []);

  const checkWalletConnection = async () => {
    try {
      const connected = await isConnected();
      const allowed = await isAllowed();
      if (connected && allowed) {
        const key = await getAddress();
        setPublicKey(key.address);
        setIsWalletConnected(true);
        localStorage.setItem('stellar_wallet_public_key', key.address);
      }
    } catch {
      // Not connected
    }
  };

  const isFreighterInstalled = async (): Promise<boolean> => {
    try {
      return await isConnected();
    } catch {
      return false;
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        setShowInstallPrompt(true);
        setIsLoading(false);
        return;
      }
      const allowed = await isAllowed();
      if (!allowed) {
        setShowInstallPrompt(false);
        setIsLoading(false);
        return;
      }
      const key = await getAddress();
      setPublicKey(key.address);
      setIsWalletConnected(true);
      localStorage.setItem('stellar_wallet_public_key', key.address);
      showSuccess('Wallet connected successfully.');
    } catch {
      showError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryInstall = async () => {
    const installed = await isFreighterInstalled();
    if (installed) {
      setShowInstallPrompt(false);
      connectWallet();
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
    setIsWalletConnected(false);
    localStorage.removeItem('stellar_wallet_public_key');
  };

  return (
    <WalletContext.Provider value={{ publicKey, isWalletConnected, connectWallet, disconnectWallet, isLoading }}>
      {children}
      <InstallFreighterModal
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        onRetry={handleRetryInstall}
      />
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
};
