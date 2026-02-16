import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import IconButton from '@mui/material/IconButton'
import FavoriteIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleIcon from '@mui/icons-material/ChatBubbleOutline'
import ShareIcon from '@mui/icons-material/Share'
import MoreVertIcon from '@mui/icons-material/MoreVert'

export type FeedCardProps = {
  userName: string
  userAvatar?: string | null
  createdAt: Date
  caption: string
  imageUrl?: string
}

export function FeedCard({
  userName,
  userAvatar,
  createdAt,
  caption,
  imageUrl,
}: FeedCardProps) {
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(createdAt)
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          transition: 'border-color 0.2s ease-in-out',
        },
      }}
    >
      <CardHeader
        avatar={
          <Avatar src={userAvatar ?? undefined} aria-label="user avatar" />
        }
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Typography variant="subtitle1" fontWeight="bold">
            {userName}
          </Typography>
        }
        subheader={<Typography variant="caption">{date}</Typography>}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, pb: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {caption}
        </Typography>
      </CardContent>
      {imageUrl && (
        <CardMedia
          component="img"
          image={imageUrl}
          alt="post content"
          sx={{
            maxHeight: 500,
            width: '100%',
            objectFit: 'cover',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />
      )}
      <CardActions
        disableSpacing
        sx={{ justifyContent: 'space-between', px: 2 }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton aria-label="like" size="small">
            <FavoriteIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="comment" size="small">
            <ChatBubbleIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="share" size="small">
            <ShareIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  )
}
