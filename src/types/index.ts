export interface SIIncrement {
  _id?: string
  requestee: string
  requestedDate: Date
  shopName: string
  amount: number
  approver: string
  requesteeRole?: 'Admin' | 'Manager' | 'Staff'
  status: 'Pending' | 'Approved' | 'Rejected'
  approverComments?: string
  dateApproved?: Date
}

export interface TicketCancellation {
  _id?: string
  requestee: string
  requestedDate: Date
  tpmNo: string
  retailerID: string
  toCancel: string
  replacement: string
  amount: number
  reason: string
  customerNo: string
  approver: string
  status: 'Pending' | 'Approved' | 'Rejected'
  approverComments?: string
  dateApproved?: Date
}
