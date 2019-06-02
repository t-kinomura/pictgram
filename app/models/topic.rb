class Topic < ApplicationRecord
  validates :user_id, presence: true
  validates :desctription, presence: true
  validates :image, presence: true

  belongs_to :user

  mount_uploader :image, ImageUploader

  has_many :favorites
end
