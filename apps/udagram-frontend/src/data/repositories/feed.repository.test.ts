import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { faker } from '@faker-js/faker'
import { FeedRepository } from './feed.repository'
import type { IFeedRemoteDataSource } from '../datasources'

describe('FeedRepository', () => {
  let repository: FeedRepository
  let mockDataSource: IFeedRemoteDataSource

  const createMockFeedModel = () => ({
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
    mockDataSource = {
      getFeeds: vi.fn(),
      getFeedById: vi.fn(),
      createFeed: vi.fn(),
      deleteFeed: vi.fn(),
    }
    repository = new FeedRepository(mockDataSource)
  })

  it('getFeeds calls datasource and maps to entities', async () => {
    const mockModels = [createMockFeedModel(), createMockFeedModel()]
    ;(mockDataSource.getFeeds as Mock).mockResolvedValue(mockModels)

    const result = await repository.getFeeds()

    expect(mockDataSource.getFeeds).toHaveBeenCalled()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: mockModels[0].id,
      caption: mockModels[0].caption,
      imageUrl: mockModels[0].image_url,
      userId: mockModels[0].user_id,
      userName: mockModels[0].user_name,
      userAvatar: mockModels[0].user_avatar,
      createdAt: new Date(mockModels[0].created_at),
      updatedAt: new Date(mockModels[0].updated_at),
    })
  })

  it('getFeedById calls datasource and maps to entity', async () => {
    const mockModel = createMockFeedModel()
    const feedId = mockModel.id
    ;(mockDataSource.getFeedById as Mock).mockResolvedValue(mockModel)

    const result = await repository.getFeedById(feedId)

    expect(mockDataSource.getFeedById).toHaveBeenCalledWith(feedId)
    expect(result.id).toEqual(mockModel.id)
  })

  it('createFeed calls datasource', async () => {
    const request = {
      caption: faker.lorem.sentence(),
      file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
    }
    ;(mockDataSource.createFeed as Mock).mockResolvedValue(undefined)

    await repository.createFeed(request)

    expect(mockDataSource.createFeed).toHaveBeenCalledWith(request)
  })

  it('deleteFeed calls datasource', async () => {
    const feedId = faker.string.uuid()
    ;(mockDataSource.deleteFeed as Mock).mockResolvedValue(undefined)

    await repository.deleteFeed(feedId)

    expect(mockDataSource.deleteFeed).toHaveBeenCalledWith(feedId)
  })
})
