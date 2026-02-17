import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Skeleton from '@mui/material/Skeleton'

export function FeedCardSkeleton() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        bgcolor: 'background.paper',
      }}
    >
      <CardHeader
        avatar={
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
          />
        }
        title={
          <Skeleton
            variant="text"
            width="40%"
            height={20}
            animation="wave"
            sx={{ mb: 0.5 }}
          />
        }
        subheader={
          <Skeleton variant="text" width="25%" height={15} animation="wave" />
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0, pb: 1 }}>
        <Skeleton variant="text" width="100%" height={20} animation="wave" />
        <Skeleton variant="text" width="90%" height={20} animation="wave" />
        <Skeleton variant="text" width="60%" height={20} animation="wave" />
      </CardContent>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={300}
        animation="wave"
        sx={{
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      />
      <CardActions
        disableSpacing
        sx={{ justifyContent: 'space-between', px: 2 }}
      >
        <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            animation="wave"
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            animation="wave"
          />
          <Skeleton
            variant="circular"
            width={24}
            height={24}
            animation="wave"
          />
        </Box>
      </CardActions>
    </Card>
  )
}
