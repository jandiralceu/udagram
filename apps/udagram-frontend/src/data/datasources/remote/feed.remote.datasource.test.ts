import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { faker } from '@faker-js/faker'
import type { AxiosInstance } from 'axios'
import { FeedRemoteDataSource } from './feed.remote.datasource'

describe('FeedRemoteDataSource', () => {
  let dataSource: FeedRemoteDataSource
  let mockHttpClient: Partial<AxiosInstance>

  const createMockFeed = () => ({
    id: faker.string.uuid(),
    caption: faker.lorem.sentence(),
    image_url: faker.image.url(),
    user_id: faker.string.uuid(),
    user_name: faker.person.fullName(),
    user_avatar: faker.image.avatar(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  })

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    }
    dataSource = new FeedRemoteDataSource(mockHttpClient as AxiosInstance)
  })

  it('getFeeds calls get with correct url and returns response', async () => {
    const mockFeeds = [createMockFeed(), createMockFeed()]
    ;(mockHttpClient.get as Mock).mockResolvedValue({ data: mockFeeds })

    const result = await dataSource.getFeeds()

    expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/feeds')
    expect(result).toEqual(mockFeeds)
  })

  it('getFeedById calls get with correct url and returns response', async () => {
    const mockFeed = createMockFeed()
    const feedId = mockFeed.id
    ;(mockHttpClient.get as Mock).mockResolvedValue({ data: mockFeed })

    const result = await dataSource.getFeedById(feedId)

    expect(mockHttpClient.get).toHaveBeenCalledWith(`/api/v1/feeds/${feedId}`)
    expect(result).toEqual(mockFeed)
  })

  it('createFeed calls post with FormData and correct headers', async () => {
    const mockFeed = createMockFeed()
    const request = {
      caption: faker.lorem.sentence(),
      file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
    }
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: mockFeed })

    const result = await dataSource.createFeed(request)

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/api/v1/feeds',
      expect.any(FormData),
      expect.objectContaining({
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    )
    expect(result).toEqual(mockFeed)
  })

  it('deleteFeed calls delete with correct url', async () => {
    const feedId = faker.string.uuid()
    ;(mockHttpClient.delete as Mock).mockResolvedValue({})

    await dataSource.deleteFeed(feedId)

    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      `/api/v1/feeds/${feedId}`
    )
  })
})
