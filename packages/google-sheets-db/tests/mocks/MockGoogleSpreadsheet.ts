// Mock implementations for testing

/**
 * Mock implementation of Google Spreadsheet Row for testing
 */
export class MockGoogleSpreadsheetRow {
  private data: Record<string, any> = {}
  public rowNumber: number

  constructor(rowNumber: number, data: Record<string, any> = {}) {
    this.rowNumber = rowNumber
    this.data = { ...data }
  }

  get(header: string): any {
    return this.data[header]
  }

  set(header: string, value: any): void {
    this.data[header] = value
  }

  toObject(): Record<string, any> {
    return { ...this.data }
  }

  async save(): Promise<void> {
    // Mock save operation
    return Promise.resolve()
  }

  async delete(): Promise<void> {
    // Mock delete operation
    return Promise.resolve()
  }
}

/**
 * Mock implementation of Google Spreadsheet Worksheet for testing
 */
export class MockGoogleSpreadsheetWorksheet {
  public headerValues: string[] = []
  private rows: MockGoogleSpreadsheetRow[] = []
  private nextRowNumber = 1

  async setHeaderRow(headers: string[]): Promise<void> {
    this.headerValues = headers
    return Promise.resolve()
  }

  async getRows(): Promise<MockGoogleSpreadsheetRow[]> {
    return Promise.resolve([...this.rows])
  }

  async addRow(data: Record<string, any>): Promise<MockGoogleSpreadsheetRow> {
    const row = new MockGoogleSpreadsheetRow(this.nextRowNumber++, data)
    this.rows.push(row)
    return Promise.resolve(row)
  }

  async addRows(dataArray: Record<string, any>[]): Promise<MockGoogleSpreadsheetRow[]> {
    const newRows = dataArray.map(data => {
      const row = new MockGoogleSpreadsheetRow(this.nextRowNumber++, data)
      this.rows.push(row)
      return row
    })
    return Promise.resolve(newRows)
  }

  removeRow(rowNumber: number): void {
    this.rows = this.rows.filter(r => r.rowNumber !== rowNumber)
  }

  async clear(): Promise<void> {
    this.rows = []
    this.nextRowNumber = 1
    return Promise.resolve()
  }
}

/**
 * Mock implementation of Google Spreadsheet for testing
 */
export class MockGoogleSpreadsheet {
  public sheetsByTitle: Record<string, MockGoogleSpreadsheetWorksheet> = {}
  public sheetsById: Record<number, MockGoogleSpreadsheetWorksheet> = {}
  public title: string = 'Mock Spreadsheet'
  public sheetCount: number = 0
  private authenticated = false

  constructor(public spreadsheetId: string) {}

  async useServiceAccountAuth(creds: any): Promise<void> {
    if (!creds.client_email || !creds.private_key) {
      throw new Error('Invalid credentials')
    }
    this.authenticated = true
    return Promise.resolve()
  }

  async loadInfo(): Promise<void> {
    if (!this.authenticated) {
      throw new Error('Not authenticated')
    }
    return Promise.resolve()
  }

  async addSheet(options: { title: string; headerValues?: string[] } | string): Promise<MockGoogleSpreadsheetWorksheet> {
    const title = typeof options === 'string' ? options : options.title
    const headerValues = typeof options === 'object' ? options.headerValues : undefined
    
    const sheet = new MockGoogleSpreadsheetWorksheet()
    if (headerValues) {
      sheet.headerValues = [...headerValues]
    }
    this.sheetsByTitle[title] = sheet
    this.sheetsById[this.sheetCount] = sheet
    this.sheetCount++
    return Promise.resolve(sheet)
  }

  getSheet(title: string): MockGoogleSpreadsheetWorksheet | undefined {
    return this.sheetsByTitle[title]
  }
}