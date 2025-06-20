import { 
  LimitIncreaseRequest, 
  LimitIncreaseRequestForm, 
  LimitInfo,
  LIMIT_TYPES 
} from '../../types/limit-requests';

class LimitRequestService {
  private static instance: LimitRequestService;

  static getInstance(): LimitRequestService {
    if (!LimitRequestService.instance) {
      LimitRequestService.instance = new LimitRequestService();
    }
    return LimitRequestService.instance;
  }

  /**
   * Get current limit information for user/organization
   */
  async getLimitInfo(
    userId: string, 
    organizationId?: string
  ): Promise<Record<string, LimitInfo>> {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organizationId', organizationId);

      const response = await fetch(`/api/users/${userId}/limits?${params.toString()}`);
      if (!response.ok) {
        // Return default limits if none exist
        return LIMIT_TYPES;
      }

      const data = await response.json();
      return data.limits || LIMIT_TYPES;
    } catch (error) {
      console.error('Error fetching limit info:', error);
      return LIMIT_TYPES;
    }
  }

  /**
   * Submit a limit increase request
   */
  async submitLimitRequest(
    userId: string,
    organizationId: string | undefined,
    request: LimitIncreaseRequestForm
  ): Promise<LimitIncreaseRequest> {
    try {
      const response = await fetch('/api/limit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          userId,
          organizationId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit limit request');
      }

      const result = await response.json();
      return {
        ...result,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt),
        reviewedAt: result.reviewedAt ? new Date(result.reviewedAt) : undefined,
        effectiveDate: result.effectiveDate ? new Date(result.effectiveDate) : undefined
      };
    } catch (error) {
      console.error('Error submitting limit request:', error);
      throw error;
    }
  }

  /**
   * Get user's limit requests
   */
  async getUserLimitRequests(userId: string): Promise<LimitIncreaseRequest[]> {
    try {
      const response = await fetch(`/api/users/${userId}/limit-requests`);
      if (!response.ok) throw new Error('Failed to fetch limit requests');

      const data = await response.json();
      return data.requests.map((request: any) => ({
        ...request,
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt),
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : undefined,
        effectiveDate: request.effectiveDate ? new Date(request.effectiveDate) : undefined
      }));
    } catch (error) {
      console.error('Error fetching limit requests:', error);
      return [];
    }
  }

  /**
   * Get organization's limit requests
   */
  async getOrganizationLimitRequests(organizationId: string): Promise<LimitIncreaseRequest[]> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/limit-requests`);
      if (!response.ok) throw new Error('Failed to fetch limit requests');

      const data = await response.json();
      return data.requests.map((request: any) => ({
        ...request,
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt),
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt) : undefined,
        effectiveDate: request.effectiveDate ? new Date(request.effectiveDate) : undefined
      }));
    } catch (error) {
      console.error('Error fetching organization limit requests:', error);
      return [];
    }
  }

  /**
   * Cancel a pending limit request
   */
  async cancelLimitRequest(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/limit-requests/${requestId}/cancel`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Error canceling limit request:', error);
      return false;
    }
  }

  /**
   * Check if user can request limit increase for a specific limit type
   */
  async canRequestLimitIncrease(
    userId: string,
    limitType: string,
    organizationId?: string
  ): Promise<{
    canRequest: boolean;
    reason?: string;
    existingRequest?: LimitIncreaseRequest;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('limitType', limitType);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await fetch(`/api/users/${userId}/can-request-limit?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to check request eligibility');

      const result = await response.json();
      
      if (result.existingRequest) {
        result.existingRequest = {
          ...result.existingRequest,
          createdAt: new Date(result.existingRequest.createdAt),
          updatedAt: new Date(result.existingRequest.updatedAt),
          reviewedAt: result.existingRequest.reviewedAt ? new Date(result.existingRequest.reviewedAt) : undefined,
          effectiveDate: result.existingRequest.effectiveDate ? new Date(result.existingRequest.effectiveDate) : undefined
        };
      }

      return result;
    } catch (error) {
      console.error('Error checking request eligibility:', error);
      return { canRequest: false, reason: 'Failed to check eligibility' };
    }
  }

  /**
   * Get request templates/suggestions
   */
  getRequestTemplate(limitType: string, currentUsage: number, currentLimit: number): {
    suggestedLimit: number;
    justificationTemplate: string;
  } {
    const limitInfo = LIMIT_TYPES[limitType as keyof typeof LIMIT_TYPES];
    
    // Suggest reasonable increase based on current usage
    let suggestedLimit = currentLimit;
    
    if (currentUsage >= currentLimit * 0.9) {
      // If near limit, suggest doubling
      suggestedLimit = Math.min(currentLimit * 2, limitInfo?.maxRequestableLimit || currentLimit * 2);
    } else if (currentUsage >= currentLimit * 0.7) {
      // If approaching limit, suggest 50% increase
      suggestedLimit = Math.min(Math.ceil(currentLimit * 1.5), limitInfo?.maxRequestableLimit || currentLimit * 2);
    } else {
      // Otherwise suggest modest increase
      suggestedLimit = Math.min(currentLimit + Math.ceil(currentLimit * 0.5), limitInfo?.maxRequestableLimit || currentLimit * 2);
    }

    const justificationTemplates = {
      organizations_per_user: `I need to create additional organizations to manage separate business units/clients. Currently using ${currentUsage}/${currentLimit} organizations.`,
      projects_per_organization: `Our organization is growing and we need more projects to organize our work effectively. We currently have ${currentUsage}/${currentLimit} projects and are approaching the limit.`,
      tasks_per_project: `Our projects are becoming more detailed and require more tasks for proper management. Current usage is ${currentUsage}/${currentLimit} tasks.`,
      members_per_organization: `Our team is expanding and we need to accommodate more members. We currently have ${currentUsage}/${currentLimit} members.`,
      collaborators_per_personal_board: `I need to collaborate with more team members on my personal board for cross-functional work.`,
      storage_per_organization: `Our organization needs more storage space for project files, documents, and assets.`,
      api_calls_per_month: `Our API usage is increasing due to integrations and automation needs.`
    };

    return {
      suggestedLimit,
      justificationTemplate: justificationTemplates[limitType as keyof typeof justificationTemplates] || 
        `I need an increase in ${limitType.replace(/_/g, ' ')} to support my growing usage requirements.`
    };
  }

  /**
   * Validate limit request before submission
   */
  validateLimitRequest(request: LimitIncreaseRequestForm): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if limit type exists
    const limitInfo = LIMIT_TYPES[request.limitType];
    if (!limitInfo) {
      errors.push('Invalid limit type');
      return { valid: false, errors, warnings };
    }

    // Check requested limit
    if (request.requestedLimit <= limitInfo.currentLimit) {
      errors.push('Requested limit must be higher than current limit');
    }

    if (request.requestedLimit > limitInfo.maxRequestableLimit) {
      errors.push(`Requested limit exceeds maximum requestable limit of ${limitInfo.maxRequestableLimit}`);
    }

    // Check justification
    if (!request.businessJustification.trim()) {
      errors.push('Business justification is required');
    } else if (request.businessJustification.length < 50) {
      warnings.push('Consider providing more detailed justification for better approval chances');
    }

    // Check for reasonable increase
    const increaseRatio = request.requestedLimit / limitInfo.currentLimit;
    if (increaseRatio > 10) {
      warnings.push('Very large increase requested - consider requesting a smaller increase first');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get estimated approval time
   */
  getEstimatedApprovalTime(request: LimitIncreaseRequestForm): string {
    const limitInfo = LIMIT_TYPES[request.limitType];
    
    // Auto-approval cases
    if (limitInfo.autoApprovalThreshold && request.requestedLimit <= limitInfo.autoApprovalThreshold) {
      return 'Immediate (auto-approval)';
    }

    // Based on urgency and size of request
    switch (request.urgency) {
      case 'urgent':
        return '1-2 business days';
      case 'high':
        return '3-5 business days';
      case 'medium':
        return '5-7 business days';
      case 'low':
        return '7-14 business days';
      default:
        return '5-7 business days';
    }
  }
}

export const limitRequestService = LimitRequestService.getInstance();
