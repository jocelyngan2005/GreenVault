// React hooks for smart contract operations
'use client';

import { useState, useCallback, useEffect } from 'react';
import { smartContractService, SmartContractResponse } from './smartContractService';

interface UseSmartContractState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  txDigest?: string;
}

interface UseSmartContractReturn<T = any> extends UseSmartContractState<T> {
  execute: (...args: any[]) => Promise<SmartContractResponse<T>>;
  reset: () => void;
}

/**
 * Generic hook for smart contract operations
 */
function useSmartContract<T = any>(
  operation: (...args: any[]) => Promise<SmartContractResponse<T>>
): UseSmartContractReturn<T> {
  const [state, setState] = useState<UseSmartContractState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<SmartContractResponse<T>> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await operation(...args);

        if (result.success) {
          setState({
            data: result.data || null,
            loading: false,
            error: null,
            txDigest: result.txDigest,
          });
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.error || 'Operation failed',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [operation]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// === Specific hooks for common operations ===

/**
 * Hook for buying carbon credits
 */
export function useBuyCarbonCredit() {
  return useSmartContract(
    (creditId: string, paymentAmount: number, privateKey?: string) =>
      smartContractService.buyCarbonCredit({ creditId, paymentAmount }, privateKey)
  );
}

/**
 * Hook for listing carbon credits for sale
 */
export function useListCarbonCredit() {
  return useSmartContract(
    (creditId: string, price: number, reservedForCommunity: boolean, privateKey?: string) =>
      smartContractService.listCreditForSale(
        { creditId, price, reservedForCommunity },
        privateKey
      )
  );
}

/**
 * Hook for registering new projects
 */
export function useRegisterProject() {
  return useSmartContract(
    (projectData: {
      projectId: string;
      name: string;
      description: string;
      location: string;
      projectType: number;
      co2ReductionCapacity: number;
      beneficiaryCommunity?: string;
      oracleDataSource: string;
      didAnchor?: string;
    }, privateKey?: string) =>
      smartContractService.registerProject(projectData, privateKey)
  );
}

/**
 * Hook for minting carbon credits
 */
export function useMintCarbonCredit() {
  return useSmartContract(
    (creditData: {
      projectId: string;
      serialNumber: string;
      vintageYear: number;
      quantity: number;
      methodology: string;
      metadataUri: string;
      co2DataHash: string;
      didAnchor?: string;
    }, privateKey?: string) =>
      smartContractService.mintCarbonCredit(creditData, privateKey)
  );
}

/**
 * Hook for retiring carbon credits
 */
export function useRetireCarbonCredit() {
  return useSmartContract(
    (creditId: string, retirementReason: string, privateKey?: string) =>
      smartContractService.retireCarbonCredit({ creditId, retirementReason }, privateKey)
  );
}

/**
 * Hook for purchasing fractional credits
 */
export function usePurchaseFractions() {
  return useSmartContract(
    (poolId: string, fractionsToBuy: number, paymentAmount: number, privateKey?: string) =>
      smartContractService.purchaseFractions(poolId, fractionsToBuy, paymentAmount, privateKey)
  );
}

/**
 * Hook for claiming micro credits
 */
export function useClaimMicroCredits() {
  return useSmartContract(
    (
      microSystemId: string,
      actionType: string,
      evidenceHash: string,
      treasuryCapId: string,
      privateKey?: string
    ) =>
      smartContractService.claimMicroCredits(
        microSystemId,
        actionType,
        evidenceHash,
        treasuryCapId,
        privateKey
      )
  );
}

/**
 * Hook for recording sustainability actions
 */
export function useRecordSustainabilityAction() {
  return useSmartContract(
    (
      didManagerId: string,
      actionType: string,
      creditsEarned: number,
      evidenceHash: string,
      privateKey?: string
    ) =>
      smartContractService.recordSustainabilityAction(
        didManagerId,
        actionType,
        creditsEarned,
        evidenceHash,
        privateKey
      )
  );
}

/**
 * Hook for getting user credits
 */
export function useUserCredits(userAddress?: string) {
  const [state, setState] = useState<UseSmartContractState>({
    data: null,
    loading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!userAddress) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await smartContractService.getUserCredits(userAddress);

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch user credits',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [userAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
  };
}

/**
 * Hook for getting marketplace stats
 */
export function useMarketplaceStats() {
  const [state, setState] = useState<UseSmartContractState>({
    data: null,
    loading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await smartContractService.getStats();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to fetch stats',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
  };
}

/**
 * Hook for Oracle operations
 */
export function useOracleOperations() {
  const registerOracle = useSmartContract(
    (oracleRegistryId: string, oracleAddress: string, stakeAmount: number, privateKey?: string) =>
      smartContractService.registerOracle(oracleRegistryId, oracleAddress, stakeAmount, privateKey)
  );

  const requestVerification = useSmartContract(
    (
      projectId: string,
      measurementType: string,
      value: number,
      unit: string,
      locationHash: string,
      methodology: string,
      privateKey?: string
    ) =>
      smartContractService.requestCO2Verification(
        projectId,
        measurementType,
        value,
        unit,
        locationHash,
        methodology,
        privateKey
      )
  );

  const submitVerification = useSmartContract(
    (
      oracleRegistryId: string,
      requestId: string,
      verifiedValue: number,
      confidence: number,
      evidenceHash: string,
      privateKey?: string
    ) =>
      smartContractService.submitOracleVerification(
        oracleRegistryId,
        requestId,
        verifiedValue,
        confidence,
        evidenceHash,
        privateKey
      )
  );

  return {
    registerOracle,
    requestVerification,
    submitVerification,
  };
}

/**
 * Hook for DID Manager operations
 */
export function useDIDOperations() {
  const createIdentity = useSmartContract(
    (
      didManagerId: string,
      did: string,
      encryptedAttributes: string[],
      attributeKeys: string[],
      privacyHash: string,
      communityContext?: string,
      privateKey?: string
    ) =>
      smartContractService.createIdentity(
        didManagerId,
        did,
        encryptedAttributes,
        attributeKeys,
        privacyHash,
        communityContext,
        privateKey
      )
  );

  const updatePrivacySettings = useSmartContract(
    (
      didManagerId: string,
      publicProfile: boolean,
      shareReputation: boolean,
      allowCommunityVerification: boolean,
      dataRetentionDays: number,
      privateKey?: string
    ) =>
      smartContractService.updatePrivacySettings(
        didManagerId,
        publicProfile,
        shareReputation,
        allowCommunityVerification,
        dataRetentionDays,
        privateKey
      )
  );

  const recordAction = useRecordSustainabilityAction();

  return {
    createIdentity,
    updatePrivacySettings,
    recordAction,
  };
}

/**
 * Hook for Integration Bridge operations
 */
export function useIntegrationBridge() {
  const initializeHub = useSmartContract(
    (
      carbonRegistryId: string,
      marketplaceId: string,
      oracleRegistryId: string,
      didManagerId: string,
      microSystemId: string,
      privateKey?: string
    ) =>
      smartContractService.initializeHub(
        carbonRegistryId,
        marketplaceId,
        oracleRegistryId,
        didManagerId,
        microSystemId,
        privateKey
      )
  );

  const generateImpactReport = useSmartContract(
    (
      hubId: string,
      registryId: string,
      marketplaceId: string,
      projectId: string,
      privateKey?: string
    ) =>
      smartContractService.generateImpactReport(
        hubId,
        registryId,
        marketplaceId,
        projectId,
        privateKey
      )
  );

  const onboardMember = useSmartContract(
    (
      hubId: string,
      didManagerId: string,
      microSystemId: string,
      did: string,
      encryptedAttributes: string[],
      attributeKeys: string[],
      privacyHash: string,
      communityContext?: string,
      privateKey?: string
    ) =>
      smartContractService.onboardCommunityMember(
        hubId,
        didManagerId,
        microSystemId,
        did,
        encryptedAttributes,
        attributeKeys,
        privacyHash,
        communityContext,
        privateKey
      )
  );

  return {
    initializeHub,
    generateImpactReport,
    onboardMember,
  };
}

export default useSmartContract;
