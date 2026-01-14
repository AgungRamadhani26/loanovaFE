/**
 * Model untuk data cabang (Branch) sesuai dengan response dari backend.
 * Mapping dari BranchResponse.java di backend.
 */
export interface BranchData {
    id: number;
    branchCode: string;
    branchName: string;
    address: string;
}
