import { NextRequest, NextResponse } from 'next/server'

interface ApiHandlerOptions<T> {
  fetcher: () => Promise<T>
  transform?: (data: T) => unknown
  revalidate?: number
}

export function createApiHandler<T>({
  fetcher,
  transform,
  revalidate = 0
}: ApiHandlerOptions<T>) {
  return async function handler(_request: NextRequest) {
    try {
      const data = await fetcher()
      const responseData = transform ? transform(data) : data
      
      const response = NextResponse.json(responseData)
      
      if (revalidate > 0) {
        response.headers.set('Cache-Control', `s-maxage=${revalidate}, stale-while-revalidate`)
      } else {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
      
      return response
    } catch (error) {
      console.error('API handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export function createPollingApiHandler<T>(options: ApiHandlerOptions<T>) {
  return createApiHandler({
    ...options,
    revalidate: 0 // Polling endpoints shouldn't cache
  })
}