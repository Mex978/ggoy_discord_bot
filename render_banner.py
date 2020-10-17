from PIL import Image, ImageDraw, ImageOps, ImageFont
from io import BytesIO
import requests
import discord
import sys
import os


ZELDA_FONT = "./fonts/zeldadxt.ttf"
FIRSTJOB_FONT = "./fonts/FirstJob-X8rP.ttf"
QUICKSAND_FONT = "./fonts/Quicksand-Regular.ttf"

def parse_xp(xp):
  temp = xp
  if temp >= 1000000000:
    temp = temp / 1000000000.0
    temp = f"{temp:.2f} KKK"
  elif temp >= 1000000:
    temp = temp / 1000000.0
    temp = f"{temp:.2f} KK"
  elif temp >= 1000:
    temp = temp / 1000.0
    temp = f"{temp:.2f} K"
  else:
    temp = f"{temp:.2f}"
  return temp
  

def get_font(font_familly, font_size):
  if font_familly is None:
    return ImageFont.load_default()
  return ImageFont.truetype(font_familly, font_size)

def new_text(draw, message, font_size, color, position, font_familly):
  font = get_font(font_familly, font_size)
  draw.text(position, message, color, font)
  return draw

def circle_avatar(im):
  _im = im
  bigsize = (im.size[0] * 3, _im.size[1] * 3)
  mask = Image.new('L', bigsize, 0)
  draw = ImageDraw.Draw(mask) 
  draw.ellipse((0, 0) + bigsize, fill=255, outline="orange", width=2)
  mask = mask.resize(_im.size, Image.ANTIALIAS)
  _im.putalpha(mask)
  return _im, mask

def round_corner(radius, fill, color_type):
    """Draw a round corner"""
    corner = Image.new(color_type, (radius, radius), (0, 0, 0, 0))
    draw = ImageDraw.Draw(corner)
    draw.pieslice((0, 0, radius * 2, radius * 2), 180, 270, fill=fill)
    return corner


def round_rectangle(img, radius, fill, color_type="RGB"):
    """Draw a rounded rectangle"""
    width, height = img.size
    corner = round_corner(radius, fill, color_type)
    img.paste(corner, (0, 0))
    img.paste(corner.rotate(90), (0, height - radius))  # Rotate the corner and paste it
    img.paste(corner.rotate(180), (width - radius, height - radius))
    img.paste(corner.rotate(270), (width - radius, 0))
    return img

def add_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2, rad * 2), fill=255)
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    im.putalpha(alpha)
    return im, alpha

def resize_image(im, size):
  _im = im
  _im.thumbnail(size, Image.ANTIALIAS)
  return _im

def run(avatar_url, xp_needed, username, level, xp):
  W, H = (600, 180)
  small_size = (150, 150)
  
  response = requests.get(avatar_url)
  perfil_image = Image.open(BytesIO(response.content))
  perfil_image_resized = resize_image(perfil_image, small_size)
  perfil_image_cropped, mask = circle_avatar(perfil_image_resized)

  _progress = ((xp * 100.0 / xp_needed) * 385)/100

  progress_bar = Image.new("RGBA", (int(_progress), 20), "orange")
  progress_bar = round_rectangle(progress_bar, 10, "orange", color_type="RGBA")

  progress_bar_background = Image.new("RGBA", (385, 20), "grey")
  progress_bar_background = round_rectangle(progress_bar_background, 10, "grey")
  progress_bar_background.paste(progress_bar, (0,0), progress_bar)

  _,h = perfil_image_cropped.size
  print(h)
  print(H - h)
  background = Image.new("RGBA", (W, H), "black")
  background.paste(perfil_image_cropped, (15, int((H - h) / 2)), mask)
  background.paste(progress_bar_background, (190, 90))
  background,_ = add_corners(background, 5)

  draw = ImageDraw.Draw(background)

  draw = new_text(draw, f"{username}", 24, "white", (190, 45), QUICKSAND_FONT)
  
  w, _ = draw.textsize(f"LEVEL {level}", font=get_font(ZELDA_FONT, 30))
  new_text(draw, f"LEVEL {level}", 30, "orange", ((W-(w + 20)), 45), ZELDA_FONT)

  new_text(draw, f"{parse_xp(xp)}", 14, "orange", (190, 120), QUICKSAND_FONT)

  w, _ = draw.textsize(f"{parse_xp(xp_needed)}", font=get_font(QUICKSAND_FONT, 14))
  new_text(draw, f"{parse_xp(xp_needed)}", 14, "white", ((W-(w + 30)), 120), QUICKSAND_FONT)
  
  # background.show() # TODO: Remove this line
  
  arr = BytesIO()
  background.save(arr, format='PNG')
  arr.seek(0)
  file = discord.File(arr, "card.png")
  return file